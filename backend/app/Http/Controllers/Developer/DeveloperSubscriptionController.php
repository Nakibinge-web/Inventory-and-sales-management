<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DeveloperSubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    /**
     * Display a paginated listing of tenant subscriptions for developers.
     * GET /api/developer/subscriptions
     */
    public function index(Request $request): JsonResponse
    {
        $this->subscriptionService->syncMissingFromTenants();

        $validated = $request->validate([
            'plan'             => ['nullable', 'string', 'max:50'],
            'status'           => ['nullable', 'string', 'max:30'],
            'search'           => ['nullable', 'string', 'max:255'],
            'is_complimentary' => ['nullable', 'boolean'],
            'date_from'        => ['nullable', 'date'],
            'date_to'          => ['nullable', 'date'],
            'per_page'         => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = TenantSubscription::with(['tenant:id,name,email,phone,status,subscription_plan,subscription_status,subscription_expires_at'])
            ->orderByDesc('expires_at')
            ->orderByDesc('id');

        // Filter: Plan Name
        if (!empty($validated['plan'])) {
            $query->where('plan_name', 'like', "%{$validated['plan']}%");
        }

        // Filter: Subscription Status
        if (!empty($validated['status'])) {
            $query->where('status', strtolower($validated['status']));
        }

        // Filter: Complimentary status
        if ($request->has('is_complimentary')) {
            $query->where('is_complimentary', $request->boolean('is_complimentary'));
        }

        // Filter: Search across tenant name or notes
        if (!empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(function ($q) use ($term) {
                $q->where('notes', 'like', "%{$term}%")
                  ->orWhereHas('tenant', function ($tq) use ($term) {
                      $tq->where('name', 'like', "%{$term}%")
                         ->orWhere('email', 'like', "%{$term}%");
                  });
            });
        }

        // Filter: Expiration or creation date range
        if (!empty($validated['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($validated['date_from'])->startOfDay());
        }
        if (!empty($validated['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($validated['date_to'])->endOfDay());
        }

        $perPage = $validated['per_page'] ?? 25;
        $paginated = $query->paginate($perPage);

        $items = collect($paginated->items())->map(function (TenantSubscription $sub) {
            return $this->serializeSubscription($sub);
        })->values()->all();

        return response()->json([
            'success'    => true,
            'data'       => $items,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Display subscription details and history by Subscription ID.
     * GET /api/developer/subscriptions/{id}
     */
    public function show(int $id): JsonResponse
    {
        $subscription = TenantSubscription::with([
            'tenant:id,name,email,phone,status,enabled_modules,subscription_plan,subscription_status,subscription_expires_at',
            'history.actor:id,name,email',
        ])->find($id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription record not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->serializeSubscription($subscription),
        ]);
    }

    /**
     * Display a tenant's subscription and history by Tenant ID.
     * GET /api/developer/tenants/{id}/subscription
     */
    public function tenantSubscription(int $tenantId): JsonResponse
    {
        $tenant = Tenant::find($tenantId);

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant not found.',
            ], 404);
        }

        $subscription = $this->subscriptionService->getOrCreateSubscription($tenant);
        $subscription->load([
            'tenant:id,name,email,status,enabled_modules',
            'history.actor:id,name,email',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $subscription,
        ]);
    }

    /**
     * Extend a tenant's trial period.
     * POST /api/developer/tenants/{tenantId}/subscription/extend-trial
     * POST /api/developer/subscriptions/{id}/extend-trial
     */
    public function extendTrial(Request $request, int $id): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $id);

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant or subscription record not found.',
            ], 404);
        }

        $validated = $request->validate([
            'days'   => ['required', 'integer', 'min:1', 'max:365'],
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $updatedSub = $this->subscriptionService->extendTrial(
                $tenant,
                $validated['days'],
                $validated['reason'] ?? null,
                Auth::user()
            );

            return response()->json([
                'success' => true,
                'message' => "Trial successfully extended by {$validated['days']} days.",
                'data'    => $updatedSub->load('history.actor:id,name,email'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Change a tenant's subscription plan and synchronize entitlements.
     * POST /api/developer/tenants/{tenantId}/subscription/change-plan
     * POST /api/developer/subscriptions/{id}/change-plan
     */
    public function changePlan(Request $request, int $id): JsonResponse
    {
        $tenant = $this->resolveTenant($request, $id);

        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant or subscription record not found.',
            ], 404);
        }

        $availablePlans = array_keys(SubscriptionService::PLANS);

        $validated = $request->validate([
            'plan_name'        => ['required', 'string'],
            'billing_cycle'    => ['nullable', 'string', Rule::in(['monthly', 'yearly'])],
            'is_complimentary' => ['nullable', 'boolean'],
            'reason'           => ['nullable', 'string', 'max:255'],
            'max_users'        => ['nullable', 'integer', 'min:1'],
            'max_products'     => ['nullable', 'integer', 'min:1'],
            'price'            => ['nullable', 'numeric', 'min:0'],
        ]);

        // Normalize plan name case-insensitively
        $matchedPlan = null;
        foreach ($availablePlans as $p) {
            if (strcasecmp($p, $validated['plan_name']) === 0) {
                $matchedPlan = $p;
                break;
            }
        }

        if (!$matchedPlan) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid plan specified. Available plans: ' . implode(', ', $availablePlans),
            ], 422);
        }

        try {
            $options = array_filter([
                'billing_cycle'    => $validated['billing_cycle'] ?? null,
                'is_complimentary' => $request->has('is_complimentary') ? $request->boolean('is_complimentary') : null,
                'max_users'        => $validated['max_users'] ?? null,
                'max_products'     => $validated['max_products'] ?? null,
                'price'            => $validated['price'] ?? null,
            ], fn($val) => $val !== null);

            $updatedSub = $this->subscriptionService->changePlan(
                $tenant,
                $matchedPlan,
                $options,
                $validated['reason'] ?? null,
                Auth::user()
            );

            return response()->json([
                'success' => true,
                'message' => "Subscription plan changed to {$matchedPlan}.",
                'data'    => [
                    'subscription'    => $updatedSub->load('history.actor:id,name,email'),
                    'enabled_modules' => $tenant->fresh()->enabled_modules,
                ],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Helper to resolve tenant whether called via /tenants/{tenantId}/subscription or /subscriptions/{subId}.
     */
    protected function resolveTenant(Request $request, int $id): ?Tenant
    {
        if (str_contains($request->path(), 'developer/tenants')) {
            return Tenant::find($id);
        }

        $subscription = TenantSubscription::find($id);
        return $subscription?->tenant;
    }

    protected function serializeSubscription(TenantSubscription $sub): array
    {
        $arr = $sub->toArray();
        $arr['effective_status'] = $sub->effectiveStatus();
        $arr['remaining_days'] = $sub->daysRemaining();
        return $arr;
    }
}
