<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\ApiRequestLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class DeveloperTelemetryController extends Controller
{
    /**
     * Display a paginated listing of API request telemetry logs.
     * GET /api/developer/requests
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status'     => ['nullable', 'string', 'max:10'],
            'method'     => ['nullable', 'string', 'max:10'],
            'search'     => ['nullable', 'string', 'max:255'],
            'tenant_id'  => ['nullable', 'integer'],
            'user_id'    => ['nullable', 'integer'],
            'slow_only'  => ['nullable', 'boolean'],
            'date_from'  => ['nullable', 'date'],
            'date_to'    => ['nullable', 'date'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = ApiRequestLog::with([
            'user:id,name,email',
            'tenant:id,name',
        ])->orderByDesc('id');

        // Filter: Status Code or Category
        if (!empty($validated['status'])) {
            $status = strtolower($validated['status']);
            match ($status) {
                '2xx'   => $query->whereBetween('status_code', [200, 299]),
                '3xx'   => $query->whereBetween('status_code', [300, 399]),
                '4xx'   => $query->whereBetween('status_code', [400, 499]),
                '5xx'   => $query->whereBetween('status_code', [500, 599]),
                'error' => $query->where('status_code', '>=', 400),
                default => is_numeric($status) ? $query->where('status_code', (int) $status) : null,
            };
        }

        // Filter: HTTP Method
        if (!empty($validated['method'])) {
            $query->where('method', strtoupper($validated['method']));
        }

        // Filter: Endpoint Search
        if (!empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(function ($q) use ($term) {
                $q->where('endpoint', 'like', "%{$term}%")
                  ->orWhere('route_name', 'like', "%{$term}%")
                  ->orWhere('correlation_id', 'like', "%{$term}%");
            });
        }

        // Filter: Tenant ID
        if (!empty($validated['tenant_id'])) {
            $query->where('tenant_id', $validated['tenant_id']);
        }

        // Filter: User ID
        if (!empty($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        // Filter: Slow Requests
        if ($request->boolean('slow_only')) {
            $threshold = config('telemetry.slow_threshold_ms', 500);
            $query->where('duration_ms', '>=', $threshold);
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
     * Display a single request log record by ID.
     * GET /api/developer/requests/{id}
     */
    public function show(int $id): JsonResponse
    {
        $log = ApiRequestLog::with([
            'user:id,name,email',
            'tenant:id,name',
        ])->find($id);

        if (!$log) {
            return response()->json([
                'success' => false,
                'message' => 'Telemetry record not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $log,
        ]);
    }
}
