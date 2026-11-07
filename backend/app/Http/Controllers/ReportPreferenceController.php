<?php

namespace App\Http\Controllers;

use App\Models\ReportPreference;
use App\Jobs\GenerateAutomatedReportJob;
use App\Services\ReportService;
use App\Services\ReportDeliveryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class ReportPreferenceController extends Controller
{
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
            'report_type'      => ['required', Rule::in([
                'daily_sales', 'weekly_sales', 'monthly_sales', 'yearly_sales',
                'daily_purchases', 'monthly_purchases'
            ])],
            'frequency'        => ['required', Rule::in([
                'every_5_minutes', 'every_10_minutes', 'every_15_minutes', 'every_30_minutes',
                'hourly', 'every_2_hours', 'every_6_hours',
                'daily', 'weekly', 'monthly', 'custom_minutes'
            ])],
            'time_of_day'      => 'nullable|string|max:10',
            'day_of_week'      => 'nullable|string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'day_of_month'     => 'nullable|integer|min:1|max:31',
            'interval_minutes' => 'nullable|integer|min:1|max:10080',
            'is_enabled'       => 'boolean',
            'delivery_method'  => ['required', Rule::in(['dashboard', 'email', 'both'])],
            'recipient_email'  => 'nullable|email',
        ]);

        // Strict Tenant Isolation
        $validated['tenant_id'] = $user->tenant_id;

        // Resolve interval in minutes
        $intervalMinutes = $validated['interval_minutes'] ?? null;
        if (!$intervalMinutes) {
            $intervalMap = [
                'every_5_minutes'  => 5,
                'every_10_minutes' => 10,
                'every_15_minutes' => 15,
                'every_30_minutes' => 30,
                'hourly'           => 60,
                'every_2_hours'    => 120,
                'every_6_hours'    => 360,
            ];
            $intervalMinutes = $intervalMap[$validated['frequency']] ?? null;
        }
        $validated['interval_minutes'] = $intervalMinutes;

        // Compute immediate next_run_at countdown start
        $isEnabled = $validated['is_enabled'] ?? true;
        if ($isEnabled) {
            if ($intervalMinutes && $intervalMinutes > 0) {
                // High frequency / sub-day minutes: countdown starts NOW
                $validated['next_run_at'] = Carbon::now()->addMinutes((int)$intervalMinutes);
            } elseif ($validated['frequency'] === 'daily' && !empty($validated['time_of_day'])) {
                $todayRun = Carbon::parse(Carbon::now()->toDateString() . ' ' . $validated['time_of_day']);
                $validated['next_run_at'] = Carbon::now()->gte($todayRun) ? $todayRun->addDay() : $todayRun;
            } elseif ($validated['frequency'] === 'weekly' && !empty($validated['day_of_week'])) {
                $time = $validated['time_of_day'] ?? '09:00';
                $nextDate = Carbon::parse("next {$validated['day_of_week']} {$time}");
                $validated['next_run_at'] = $nextDate;
            } elseif ($validated['frequency'] === 'monthly' && !empty($validated['day_of_month'])) {
                $day = min((int)$validated['day_of_month'], 28);
                $time = $validated['time_of_day'] ?? '09:00';
                $next = Carbon::now()->setDay($day)->setTimeFromTimeString($time);
                if (Carbon::now()->gte($next)) {
                    $next->addMonth();
                }
                $validated['next_run_at'] = $next;
            } else {
                $validated['next_run_at'] = Carbon::now()->addMinutes(5);
            }
        } else {
            $validated['next_run_at'] = null;
        }

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

        return response()->json([
            'success' => true,
            'message' => 'Automation settings saved successfully. Countdown started.',
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
            'frequency'        => ['sometimes', Rule::in([
                'every_5_minutes', 'every_10_minutes', 'every_15_minutes', 'every_30_minutes',
                'hourly', 'every_2_hours', 'every_6_hours',
                'daily', 'weekly', 'monthly', 'custom_minutes'
            ])],
            'time_of_day'      => 'nullable|string|max:10',
            'day_of_week'      => 'nullable|string|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'day_of_month'     => 'nullable|integer|min:1|max:31',
            'interval_minutes' => 'nullable|integer|min:1|max:10080',
            'is_enabled'       => 'sometimes|boolean',
            'delivery_method'  => ['sometimes', Rule::in(['dashboard', 'email', 'both'])],
            'recipient_email'  => 'nullable|email',
        ]);

        if (isset($validated['frequency']) || isset($validated['interval_minutes'])) {
            $freq = $validated['frequency'] ?? $preference->frequency;
            $interval = $validated['interval_minutes'] ?? $preference->interval_minutes;
            if (!$interval) {
                $intervalMap = [
                    'every_5_minutes'  => 5,
                    'every_10_minutes' => 10,
                    'every_15_minutes' => 15,
                    'every_30_minutes' => 30,
                    'hourly'           => 60,
                    'every_2_hours'    => 120,
                    'every_6_hours'    => 360,
                ];
                $interval = $intervalMap[$freq] ?? 5;
            }
            $validated['interval_minutes'] = $interval;
            $validated['next_run_at'] = Carbon::now()->addMinutes((int)$interval);
        }

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
     * Trigger generation when scheduled countdown finishes.
     * Automatically saves to database and advances countdown for next interval (continuous).
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

        // Run job synchronously to save report in DB
        $job = new GenerateAutomatedReportJob($preference->id, 'automated');
        $savedReport = $job->handle($reportService, $deliveryService);

        // Advance next_run_at for continuous loop
        $interval = (int) ($preference->interval_minutes ?: 5);
        $nextRunAt = Carbon::now()->addMinutes($interval);

        $preference->update([
            'last_sent_at' => Carbon::now(),
            'next_run_at'  => $nextRunAt,
        ]);

        return response()->json([
            'success'    => true,
            'message'    => 'Automated report compiled and saved to database successfully.',
            'data'       => $savedReport,
            'preference' => $preference->fresh(),
        ]);
    }

    /**
     * Check any due reports for this tenant and execute them.
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
            $job = new GenerateAutomatedReportJob($preference->id, 'automated');
            $saved = $job->handle($reportService, $deliveryService);

            $interval = (int) ($preference->interval_minutes ?: 5);
            $preference->update([
                'last_sent_at' => Carbon::now(),
                'next_run_at'  => Carbon::now()->addMinutes($interval),
            ]);

            $generated[] = [
                'report_type'  => $preference->report_type,
                'saved_report' => $saved,
                'next_run_at'  => $preference->next_run_at,
            ];
        }

        return response()->json([
            'success'   => true,
            'generated' => $generated,
        ]);
    }

    /**
     * Instantly trigger report generation for this preference on-demand.
     */
    public function runNow(Request $request, $id, ReportService $reportService, ReportDeliveryService $deliveryService): JsonResponse
    {
        $user = $this->authorizePermission();

        $preference = ReportPreference::where('tenant_id', $user->tenant_id)->findOrFail($id);

        $job = new GenerateAutomatedReportJob($preference->id, 'manual_trigger');
        $savedReport = $job->handle($reportService, $deliveryService);

        // If high-frequency, reset countdown to full interval from now
        if ($preference->interval_minutes && $preference->interval_minutes > 0) {
            $preference->update([
                'last_sent_at' => Carbon::now(),
                'next_run_at'  => Carbon::now()->addMinutes((int)$preference->interval_minutes),
            ]);
        }

        return response()->json([
            'success'    => true,
            'message'    => 'Report generated and saved to database successfully.',
            'data'       => $savedReport,
            'preference' => $preference->fresh(),
        ]);
    }
}
