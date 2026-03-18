<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Display users for a specific tenant.
     * GET /api/users?tenant_id=1
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');
        
        $users = User::where('tenant_id', $tenantId)
                    ->select('id', 'name', 'email', 'role', 'created_at')
                    ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Create a new user account.
     * POST /api/users
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'role' => 'required|in:admin,manager,cashier',
            'password' => 'required|string|min:8'
        ]);

        // Check if email already exists for this tenant
        $existingUser = User::where('tenant_id', $validated['tenant_id'])
                           ->where('email', $validated['email'])
                           ->first();

        if ($existingUser) {
            return response()->json([
                'success' => false,
                'message' => 'Email already exists for this business'
            ], 422);
        }

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ]
        ], 201);
    }

    /**
     * Display specific user details.
     * GET /api/users/{id}
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'tenant' => $user->tenant->name,
                'created_at' => $user->created_at
            ]
        ]);
    }

    /**
     * Update user information.
     * PUT /api/users/{id}
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255',
            'role' => 'sometimes|required|in:admin,manager,cashier',
            'password' => 'sometimes|nullable|string|min:8'
        ]);

        // Check email uniqueness within tenant if email is being updated
        if (isset($validated['email']) && $validated['email'] !== $user->email) {
            $existingUser = User::where('tenant_id', $user->tenant_id)
                               ->where('email', $validated['email'])
                               ->where('id', '!=', $user->id)
                               ->first();

            if ($existingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email already exists for this business'
                ], 422);
            }
        }

        // Hash password if provided
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ]
        ]);
    }

    /**
     * Delete user account.
     * DELETE /api/users/{id}
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Get users by role for a tenant.
     * GET /api/users/by-role?tenant_id=1&role=cashier
     */
    public function getUsersByRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'role' => 'required|in:admin,manager,cashier'
        ]);

        $users = User::where('tenant_id', $validated['tenant_id'])
                    ->where('role', $validated['role'])
                    ->select('id', 'name', 'email', 'role')
                    ->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }
}