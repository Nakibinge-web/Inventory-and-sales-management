<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateAutomatedReportJob;
use App\Models\GeneratedReport;
use App\Models\ReportPreference;
use App\Services\ReportDeliveryService;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class ReportPreferenceController extends Controller
{
    private const SUPPORTED_REPORT_TYPES = [
        'daily_sales',
        'weekly_sales',
        'monthly_sales',
        'yearly_sales',
        'daily_purchases',
        'monthly_purchases',
    ];

    private const SUPPORTED_FREQUENCIES = [
        'every_5_minutes',
        'every_10_minutes',
        'every_15_minutes',
        'every_30_minutes',
        'hourly',
        'every_2_hours',
        'every_6_hours',
        'daily',
        'weekly',
        'monthly',
        'custom_minutes',
        'scheduled_once',
    ];

    private function authorizePermission()
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $isOwnerOrAdmin = $user->roles()->whereIn('name', ['owner', 'admin'])->exists();
        if (!$isOwnerOrAdmin && !$user->hasPermission('reports.configure_automation') && !$user->hasPermission('sales.report')) {
            abort(403, 'You do not have permission to configure automated reports.');
        }

        return $user;
    }

    /**
     * Resolve next_run_at in UTC from validated request inputs, respecting
     * browser-supplied ISO scheduled_at or timezone_offset when present.
     */
    private function resolveNextRunAt(array $validated, ?int $intervalMinutes): array
    {
        $isEnabled = $validated['is_enabled'] ?? true;
        if (!$isEnabled) {
            return ['next_run_at' => null, 'error' => null];
        }

        $freq = $validated['frequency'];
        $now = Carbon::now('UTC');

        if ($freq === 'scheduled_once') {
            if (empty($validated['scheduled_at'])) {
                return ['next_run_at' => null, 'error' => 'Please select a future date and time for the scheduled report.'];
            }

            $target = Carbon::parse($validated['scheduled_at'])->utc();
            if ($target->lte($now->copy()->subSeconds(30))) {
                return ['next_run_at' => null, 'error' => 'Please select a time in the future for the scheduled report.'];
            }

            return ['next_run_at' => $target, 'error' => null];
        }

        if ($intervalMinutes && $intervalMinutes > 0) {
            return ['next_run_at' => $now->copy()->addMinutes((int) $intervalMinutes), 'error' => null];
        }

        if (!empty($validated['scheduled_at']) && in_array($freq, ['daily', 'weekly', 'monthly'], true)) {
            return ['next_run_at' => Carbon::parse($validated['scheduled_at'])->utc(), 'error' => null];
        }

        // Convert client JS Date.getTimezoneOffset() (UTC - local, e.g. -180 for UTC+3)
        $tzOffsetMinutes = isset($validated['timezone_offset']) ? (int) $validated['timezone_offset'] : 0;
        $localNow = $now->copy()->subMinutes($tzOffsetMinutes);

        if ($freq === 'daily' && !empty($validated['time_of_day'])) {
            $localTarget = Carbon::parse($localNow->toDateString() . ' ' . $validated['time_of_day'], 'UTC');
            if ($localNow->gte($localTarget)) {
                $localTarget->addDay();
            }
            return ['next_run_at' => $localTarget->addMinutes($tzOffsetMinutes), 'error' => null];
        }

        if ($freq === 'weekly' && !empty($validated['day_of_week'])) {
            $time = $validated['time_of_day'] ?? '09:00';
            $localTarget = $localNow->copy()->next($validated['day_of_week'])->setTimeFromTimeString($time);
            // If today IS the chosen day and time hasn't passed yet, schedule today
            if (strtolower($localNow->format('l')) === strtolower($validated['day_of_week'])) {
                $todayTarget = Carbon::parse($localNow->toDateString() . ' ' . $time, 'UTC');
                if ($todayTarget->gt($localNow)) {
                    $localTarget = $todayTarget;
                }
            }
            return ['next_run_at' => $localTarget->addMinutes($tzOffsetMinutes), 'error' => null];
        }

        if ($freq === 'monthly' && !empty($validated['day_of_month'])) {
            $day = min((int) $validated['day_of_month'], 28);
            $time = $validated['time_of_day'] ?? '09:00';
            $localTarget = $localNow->copy()->setDay($day)->setTimeFromTimeString($time);
            if ($localNow->gte($localTarget)) {
                $localTarget->addMonth();
            }
            return ['next_run_at' => $localTarget->addMinutes($tzOffsetMinutes), 'error' => null];
        }

        return ['next_run_at' => $now->copy()->addMinutes(5), 'error' => null];
    }

    public function index(): JsonResponse
    {
        $user = $this->authorizePermission();
        $preferences = ReportPreference::where('tenant_id', $user->tenant_id)->get();
        return response()->json(['success' => true, 'data' => $preferences]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->authorizePermission();

        $validated = $request->validate([
            'report_type'      => ['required', Rule::in(self::SUPPORTED_REPORT_TYPES)],
            'frequency'        => ['required', Rule::in(self::SUPPORTED_FREQUENCIES)],
            'time_of_day'      => 'nullable|string|max:10',
            'day_of_week'      => 'nullable|string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'day_of_month'     => 'nullable|integer|min:1|max:31',
            'interval_minutes' => 'nullable|integer|min:1|max:10080',
            'scheduled_at'     => 'nullable|date',
            'timezone_offset'  => 'nullable|integer|min:-840|max:840',
            'is_enabled'       => 'boolean',
            'delivery_method'  => ['required', Rule::in(['dashboard', 'email', 'both'])],
            'recipient_email'  => 'nullable|email',
        ]);

        // Strict Tenant Isolation
        $validated['tenant_id'] = $user->tenant_id;

        // Resolve interval in minutes for loop schedules only
        $intervalMinutes = null;
        if ($validated['frequency'] === 'custom_minutes') {
            $intervalMinutes = max(1, (int) ($validated['interval_minutes'] ?? 5));
        } elseif (array_key_exists($validated['frequency'], ReportPreference::LOOP_FREQUENCY_MINUTES)) {
            $intervalMinutes = ReportPreference::LOOP_FREQUENCY_MINUTES[$validated['frequency']];
        }
        $validated['interval_minutes'] = $intervalMinutes;

        ['next_run_at' => $nextRunAt, 'error' => $scheduleError] = $this->resolveNextRunAt($validated, $intervalMinutes);
        if ($scheduleError !== null) {
            return response()->json([
                'success' => false,
                'message' => $scheduleError,
            ], 422);
        }

        $validated['next_run_at'] = $nextRunAt;
        unset($validated['scheduled_at'], $validated['timezone_offset']);

        // Find existing preference for this tenant & report type to overwrite
        $preference = ReportPreference::where('tenant_id', $user->tenant_id)
            ->where('report_type', $validated['report_type'])
            ->first();

        if ($preference) {
            $preference->update($validated);
            $statusCode = 200;
        } else {
            $preference = ReportPreference::create($validated);
            $statusCode = 201;
        }

        $message = match ($validated['frequency']) {
            'scheduled_once' => 'Report scheduled! It will generate automatically at the selected time and appear in Saved Reports.',
            'daily', 'weekly', 'monthly' => 'Recurring calendar schedule saved! Countdown started for next scheduled run.',
            default => 'Automation loop settings saved! Countdown started.',
        };

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $preference->fresh(),
        ], $statusCode);
    }

    public function show($id): JsonResponse
    {
        $user = $this->authorizePermission();
        $preference = ReportPreference::where('tenant_id', $user->tenant_id)->findOrFail($id);
        return response()->json(['success' => true, 'data' => $preference]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = $this->authorizePermission();

        $preference = ReportPreference::where('tenant_id', $user->tenant_id)->findOrFail($id);

        $validated = $request->validate([
            'frequency'        => ['sometimes', Rule::in(self::SUPPORTED_FREQUENCIES)],
            'time_of_day'      => 'nullable|string|max:10',
            'day_of_week'      => 'nullable|string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'day_of_month'     => 'nullable|integer|min:1|max:31',
            'interval_minutes' => 'nullable|integer|min:1|max:10080',
            'scheduled_at'     => 'nullable|date',
            'timezone_offset'  => 'nullable|integer|min:-840|max:840',
            'is_enabled'       => 'sometimes|boolean',
            'delivery_method'  => ['sometimes', Rule::in(['dashboard', 'email', 'both'])],
            'recipient_email'  => 'nullable|email',
        ]);

        $merged = array_merge($preference->toArray(), $validated);
        $intervalMinutes = null;
        if ($merged['frequency'] === 'custom_minutes') {
            $intervalMinutes = max(1, (int) ($merged['interval_minutes'] ?? 5));
        } elseif (array_key_exists($merged['frequency'], ReportPreference::LOOP_FREQUENCY_MINUTES)) {
            $intervalMinutes = ReportPreference::LOOP_FREQUENCY_MINUTES[$merged['frequency']];
        }
        $validated['interval_minutes'] = $intervalMinutes;

        if (
            isset($validated['frequency']) ||
            isset($validated['interval_minutes']) ||
            isset($validated['scheduled_at']) ||
            isset($validated['time_of_day']) ||
            isset($validated['is_enabled'])
        ) {
            ['next_run_at' => $nextRunAt, 'error' => $scheduleError] = $this->resolveNextRunAt($merged, $intervalMinutes);
            if ($scheduleError !== null) {
                return response()->json([
                    'success' => false,
                    'message' => $scheduleError,
                ], 422);
            }
            $validated['next_run_at'] = $nextRunAt;
        }

        unset($validated['scheduled_at'], $validated['timezone_offset']);
        $preference->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Automation preference updated.',
            'data'    => $preference->fresh(),
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $user = $this->authorizePermission();

        $preference = ReportPreference::where('tenant_id', $user->tenant_id)->findOrFail($id);
        $preference->delete();

        return response()->json(['success' => true, 'message' => 'Automation preference removed.']);
    }

    /**
     * Trigger generation when scheduled countdown finishes (or when "Generate Now" on banner is clicked).
     * Compiles and saves the report immediately in generated_reports (while queuing any email delivery),
     * and advances next_run_at (or completes a scheduled_once run).
     */
    public function executeDue(Request $request, $id, ReportService $reportService, ReportDeliveryService $deliveryService): JsonResponse
    {
        $user = $this->authorizePermission();

        $preference = ReportPreference::where('tenant_id', $user->tenant_id)->findOrFail($id);

        if (!$preference->is_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Automation schedule is paused.',
            ], 400);
        }

        $savedReport = Cache::lock("report_pref_exec_{$preference->id}", 30)->get(function () use ($preference, $reportService, $deliveryService) {
            $fresh = ReportPreference::find($preference->id);
            if (!$fresh || !$fresh->is_enabled) {
                return null;
            }

            $job = new GenerateAutomatedReportJob($fresh->id, 'automated', true);
            return $job->handle($reportService, $deliveryService);
        });

        if (!($savedReport instanceof GeneratedReport)) {
            $savedReport = null;
        }

        return response()->json([
            'success'    => true,
            'message'    => 'Automated report compiled and saved to database successfully.',
            'data'       => $savedReport,
            'preference' => $preference->fresh(),
        ]);
    }

    /**
     * Check any due reports for this tenant and execute them immediately,
     * saving each generated report to generated_reports and advancing next_run_at.
     */
    public function checkDue(Request $request, ReportService $reportService, ReportDeliveryService $deliveryService): JsonResponse
    {
        $user = $this->authorizePermission();

        $duePreferences = ReportPreference::where('tenant_id', $user->tenant_id)
            ->where('is_enabled', true)
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', Carbon::now())
            ->get();

        $generated = [];
        foreach ($duePreferences as $preference) {
            $saved = Cache::lock("report_pref_exec_{$preference->id}", 30)->get(function () use ($preference, $reportService, $deliveryService) {
                $fresh = ReportPreference::find($preference->id);
                if (
                    !$fresh ||
                    !$fresh->is_enabled ||
                    !$fresh->next_run_at ||
                    $fresh->next_run_at->gt(Carbon::now())
                ) {
                    return null;
                }

                $job = new GenerateAutomatedReportJob($fresh->id, 'automated', true);
                return $job->handle($reportService, $deliveryService);
            });

            $refreshed = $preference->fresh();
            if ($saved instanceof GeneratedReport) {
                $generated[] = [
                    'report_type'  => $refreshed->report_type,
                    'saved_report' => $saved,
                    'next_run_at'  => $refreshed->next_run_at,
                    'is_enabled'   => $refreshed->is_enabled,
                ];
            }
        }

        return response()->json([
            'success'   => true,
            'generated' => $generated,
        ]);
    }

    /**
     * Instantly trigger report generation for this preference on-demand and save to DB.
     */
    public function runNow(Request $request, $id, ReportService $reportService, ReportDeliveryService $deliveryService): JsonResponse
    {
        $user = $this->authorizePermission();

        $preference = ReportPreference::where('tenant_id', $user->tenant_id)->findOrFail($id);

        $job = new GenerateAutomatedReportJob($preference->id, 'manual_trigger', true);
        $savedReport = $job->handle($reportService, $deliveryService);

        return response()->json([
            'success'    => true,
            'message'    => 'Report generated and saved to database successfully.',
            'data'       => $savedReport,
            'preference' => $preference->fresh(),
        ]);
    }
}
