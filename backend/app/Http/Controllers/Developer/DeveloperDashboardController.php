<?php

namespace App\Http\Controllers\Developer;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantSubscription;
use App\Models\ApiRequestLog;
use App\Models\ActivityLog;
use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;

class DeveloperDashboardController extends Controller
{
    /**
     * Get aggregated metrics and recent events for the developer portal dashboard.
     * GET /api/developer/dashboard/stats
     */
    public function stats(SubscriptionService $subscriptionService): JsonResponse
    {
        $subscriptionService->syncMissingFromTenants();

        $now = now();
        $twentyFourHoursAgo = $now->copy()->subHours(24);

        // Tenant metrics
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('status', 'active')->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();
        $cancelledTenants = Tenant::where('status', 'cancelled')->count();

        // Subscription metrics
        $totalSubscriptions = TenantSubscription::count();
        $activeSubscriptions = TenantSubscription::where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
            })
            ->count();
        $trialingSubscriptions = TenantSubscription::where('status', 'trialing')
            ->where(function ($q) use ($now) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', $now);
            })
            ->count();
        $expiredSubscriptions = TenantSubscription::where(function ($q) use ($now) {
            $q->where('status', 'expired')
              ->orWhere(function ($sq) use ($now) {
                  $sq->whereNotNull('expires_at')->where('expires_at', '<=', $now);
              });
        })->count();

        // Telemetry metrics (last 24 hours)
        $requests24h = ApiRequestLog::where('created_at', '>=', $twentyFourHoursAgo)->count();
        $errors24h = ApiRequestLog::where('created_at', '>=', $twentyFourHoursAgo)->where('status_code', '>=', 400)->count();
        $slow24h = ApiRequestLog::where('created_at', '>=', $twentyFourHoursAgo)->where('duration_ms', '>=', 500)->count();
        $avgDuration24h = round((float) (ApiRequestLog::where('created_at', '>=', $twentyFourHoursAgo)->avg('duration_ms') ?? 0), 1);

        // Recent items
        $recentErrors = ApiRequestLog::where('status_code', '>=', 400)
            ->with('tenant:id,name')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $recentActivity = ActivityLog::with(['actor:id,name', 'tenant:id,name'])
            ->orderByDesc('id')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'tenants' => [
                    'total'     => $totalTenants,
                    'active'    => $activeTenants,
                    'suspended' => $suspendedTenants,
                    'cancelled' => $cancelledTenants,
                ],
                'subscriptions' => [
                    'total'     => $totalSubscriptions,
                    'active'    => $activeSubscriptions,
                    'trialing'  => $trialingSubscriptions,
                    'expired'   => $expiredSubscriptions,
                ],
                'telemetry_24h' => [
                    'total_requests' => $requests24h,
                    'errors'         => $errors24h,
                    'slow_requests'  => $slow24h,
                    'avg_latency_ms' => $avgDuration24h,
                ],
                'recent_errors'   => $recentErrors,
                'recent_activity' => $recentActivity,
            ],
        ]);
    }
}
