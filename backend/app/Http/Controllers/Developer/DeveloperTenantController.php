<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DeveloperTenantController extends Controller
{
    public const ALLOWED_STATUSES = ['active', 'suspended', 'cancelled'];

    /**
     * Display a paginated listing of tenants for platform developers.
     * GET /api/developer/tenants
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search'    => ['nullable', 'string', 'max:255'],
            'status'    => ['nullable', 'string', Rule::in(self::ALLOWED_STATUSES)],
            'plan'      => ['nullable', 'string', 'max:50'],
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Tenant::with(['subscription'])
            ->withCount(['users', 'products', 'sales'])
            ->orderByDesc('id');

        // Filter: Search Term (name, email, phone, tin, domain)
        if (!empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(function ($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('email', 'like', "%{$term}%")
                  ->orWhere('phone', 'like', "%{$term}%")
                  ->orWhere('tin', 'like', "%{$term}%");
            });
        }

        // Filter: Status
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        // Filter: Plan Name
        if (!empty($validated['plan'])) {
            $plan = $validated['plan'];
            $query->whereHas('subscription', function ($q) use ($plan) {
                $q->where('plan_name', 'like', "%{$plan}%");
            });
        }

        // Filter: Creation Date Range
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
     * Display detailed platform metadata for a single tenant.
     * GET /api/developer/tenants/{id}
     */
    public function show(int $id): JsonResponse
    {
        $tenant = Tenant::with([
            'subscription',
            'subscription.history.actor:id,name,email',
            'users' => fn($q) => $q->select('id', 'name', 'email', 'tenant_id', 'created_at')->limit(20),
        ])
        ->withCount(['users', 'products', 'sales', 'purchases'])
        ->find($id);

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id'              => $tenant->id,
                'name'            => $tenant->name,
                'email'           => $tenant->email,
                'phone'           => $tenant->phone,
                'address'         => $tenant->address,
                'tin'             => $tenant->tin,
                'website'         => $tenant->website,
                'status'          => $tenant->status ?? 'active',
                'enabled_modules' => $tenant->enabled_modules,
                'metrics'         => [
                    'users_count'     => $tenant->users_count,
                    'products_count'  => $tenant->products_count,
                    'sales_count'     => $tenant->sales_count,
                    'purchases_count' => $tenant->purchases_count,
                ],
                'subscription'    => $tenant->subscription,
                'recent_users'    => $tenant->users,
                'created_at'      => $tenant->created_at,
                'updated_at'      => $tenant->updated_at,
            ],
        ]);
    }

    /**
     * Update a tenant's operational status.
     * PATCH /api/developer/tenants/{id}/status
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $tenant = Tenant::find($id);

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant not found.',
            ], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $oldStatus = $tenant->status ?? 'active';
        $newStatus = $validated['status'];
        $reason = $validated['reason'] ?? null;

        return DB::transaction(function () use ($tenant, $oldStatus, $newStatus, $reason) {
            $tenant->update(['status' => $newStatus]);

            $severity = match ($newStatus) {
                'active'    => 'info',
                'suspended' => 'warning',
                'cancelled' => 'critical',
            };

            AuditLogService::log(
                "tenant.status_{$newStatus}",
                "Tenant '{$tenant->name}' status updated from '{$oldStatus}' to '{$newStatus}'" . ($reason ? " (Reason: {$reason})" : ""),
                [
                    'tenant_id'   => $tenant->id,
                    'target_type' => Tenant::class,
                    'target_id'   => $tenant->id,
                    'severity'    => $severity,
                    'outcome'     => 'success',
                    'properties'  => [
                        'from_status' => $oldStatus,
                        'to_status'   => $newStatus,
                        'reason'      => $reason,
                    ],
                ]
            );

            return response()->json([
                'success' => true,
                'message' => "Tenant status successfully updated to {$newStatus}.",
                'data'    => [
                    'id'              => $tenant->id,
                    'name'            => $tenant->name,
                    'status'          => $tenant->status,
                    'previous_status' => $oldStatus,
                    'reason'          => $reason,
                    'updated_at'      => $tenant->updated_at,
                ],
            ]);
        });
    }
}
