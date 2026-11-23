<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Tenant;

class EnsureTenantMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user || !$user->tenant_id) {
            return response()->json(['success' => false, 'message' => 'Tenant not identified.'], 403);
        }

        // Block disabled users from using existing tokens
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been disabled.',
            ], 403);
        }

        $tenant = Tenant::find($user->tenant_id);

        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'Tenant not found.'], 403);
        }

        if (!$request->is('api/logout') && $tenant->isSubscriptionExpired()) {
            return response()->json(
                $tenant->subscriptionBlockedPayload($user->hasRole('owner'), false),
                403
            );
        }

        if ($tenant->status === 'suspended') {
            return response()->json([
                'success' => false,
                'message' => 'Your business account has been suspended. Please contact platform administration.',
            ], 403);
        }

        // Store tenant on the request for controllers to access
        $request->merge(['_tenant_id' => $tenant->id]);
        app()->instance('current_tenant', $tenant);

        return $next($request);
    }
}
