<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeveloper
{
    /**
     * Handle an incoming request.
     * Enforces developer.portal.access as base gate, and optional granular permissions.
     */
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Authoritative base check: user must hold BOTH the 'developer' role AND 'developer.portal.access' permission
        if (!$user->isDeveloper()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Developer privileges required.',
            ], 403);
        }

        // Optional granular permission check attached to the developer role (e.g., developer.tenants.manage)
        if ($permission && !$user->hasDeveloperPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => "Access denied. Missing required permission: {$permission}.",
            ], 403);
        }

        return $next($request);
    }
}
