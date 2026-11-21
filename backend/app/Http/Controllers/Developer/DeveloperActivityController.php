<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DeveloperActivityController extends Controller
{
    /**
     * Display a paginated listing of system activity and audit logs.
     * GET /api/developer/activity
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event'       => ['nullable', 'string', 'max:100'],
            'severity'    => ['nullable', 'string', 'in:info,warning,error,critical'],
            'outcome'     => ['nullable', 'string', 'in:success,failure'],
            'actor_id'    => ['nullable', 'integer'],
            'tenant_id'   => ['nullable', 'integer'],
            'target_type' => ['nullable', 'string', 'max:100'],
            'search'      => ['nullable', 'string', 'max:255'],
            'date_from'   => ['nullable', 'date'],
            'date_to'     => ['nullable', 'date'],
            'per_page'    => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = ActivityLog::with([
            'actor:id,name,email',
            'tenant:id,name',
        ])->orderByDesc('id');

        // Filter: Event Name
        if (!empty($validated['event'])) {
            $query->where('event', $validated['event']);
        }

        // Filter: Severity
        if (!empty($validated['severity'])) {
            $query->where('severity', $validated['severity']);
        }

        // Filter: Outcome
        if (!empty($validated['outcome'])) {
            $query->where('outcome', $validated['outcome']);
        }

        // Filter: Actor ID
        if (!empty($validated['actor_id'])) {
            $query->where('actor_id', $validated['actor_id']);
        }

        // Filter: Tenant ID
        if (!empty($validated['tenant_id'])) {
            $query->where('tenant_id', $validated['tenant_id']);
        }

        // Filter: Target Type
        if (!empty($validated['target_type'])) {
            $query->where('target_type', $validated['target_type']);
        }

        // Filter: Search Term (description or event)
        if (!empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(function ($q) use ($term) {
                $q->where('description', 'like', "%{$term}%")
                  ->orWhere('event', 'like', "%{$term}%")
                  ->orWhere('correlation_id', 'like', "%{$term}%");
            });
        }

        // Filter: Date Range
        if (!empty($validated['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($validated['date_from'])->startOfDay());
        }
        if (!empty($validated['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($validated['date_to'])->endOfDay());
        }

        $perPage = $validated['per_page'] ?? 25;
        $paginated = $query->paginate($perPage);

        return response()->json([
            'success'    => true,
            'data'       => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Display a single activity log record by ID.
     * GET /api/developer/activity/{id}
     */
    public function show(int $id): JsonResponse
    {
        $log = ActivityLog::with([
            'actor:id,name,email',
            'tenant:id,name',
        ])->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Activity log record not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $log,
        ]);
    }
}
