<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * List all users in the current tenant.
     * GET /api/users
     */
    public function index(): JsonResponse
    {
        $users = User::with('roles:id,name')
                     ->select('id', 'name', 'email', 'created_at')
                     ->get();

        return response()->json(['success' => true, 'data' => $users]);
    }

    /**
     * Return the currently authenticated user's profile.
     * GET /api/users/me
     */
    public function me(): JsonResponse
    {
        $user = Auth::user()->load('roles:id,name', 'tenant:id,name,email,phone,address');

        return response()->json(['success' => true, 'data' => $user]);
    }

    /**
     * Create a new user within the current tenant.
     * POST /api/users  — requires owner or admin role
     */
    public function store(Request $request): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id;

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|max:255|unique:users,email',
            'role_ids'   => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'password'   => ['required', Password::min(8)->mixedCase()->numbers()],
        ]);

        // Ensure all assigned roles are visible to this tenant
        $validRoleIds = Role::visibleTo($tenantId)
                            ->whereIn('id', $validated['role_ids'])
                            ->pluck('id');

        if ($validRoleIds->count() !== count($validated['role_ids'])) {
            return response()->json(['success' => false, 'message' => 'One or more roles are not accessible.'], 422);
        }

        // Prevent non-owners from assigning the owner role
        $ownerRole = Role::where('name', 'owner')->whereNull('tenant_id')->first();
        $actorIsOwner = Auth::user()->hasRole('owner');

        if ($ownerRole && in_array($ownerRole->id, $validated['role_ids']) && !$actorIsOwner) {
            return response()->json(['success' => false, 'message' => 'Only owners can assign the owner role.'], 403);
        }

        $user = User::create([
            'tenant_id' => $tenantId,
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
        ]);

        $user->roles()->attach($validRoleIds);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully.',
            'data'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'roles' => $user->roles()->get(['roles.id', 'name']),
            ],
        ], 201);
    }

    /**
     * Show a specific user (must belong to same tenant).
     * GET /api/users/{user}
     */
    public function show(User $user): JsonResponse
    {
        $user->load('roles:id,name');

        return response()->json(['success' => true, 'data' => [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'roles'      => $user->roles,
            'tenant'     => $user->tenant->name,
            'created_at' => $user->created_at,
        ]]);
    }

    /**
     * Update a user's details.
     * PUT /api/users/{user}  — requires owner or admin role
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'password' => ['sometimes', 'nullable', Password::min(8)->mixedCase()->numbers()],
            'role_ids' => 'sometimes|array|min:1',
            'role_ids.*' => 'exists:roles,id',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Handle role updates if provided
        if (isset($validated['role_ids'])) {
            $tenantId = Auth::user()->tenant_id;

            $validRoleIds = Role::visibleTo($tenantId)
                                ->whereIn('id', $validated['role_ids'])
                                ->pluck('id');

            if ($validRoleIds->count() !== count($validated['role_ids'])) {
                return response()->json(['success' => false, 'message' => 'One or more roles are not accessible.'], 422);
            }

            $ownerRole = Role::where('name', 'owner')->whereNull('tenant_id')->first();
            $actorIsOwner = Auth::user()->hasRole('owner');

            if ($ownerRole && in_array($ownerRole->id, $validated['role_ids']) && !$actorIsOwner) {
                return response()->json(['success' => false, 'message' => 'Only owners can assign the owner role.'], 403);
            }

            $user->roles()->sync($validRoleIds);
            unset($validated['role_ids']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully.',
            'data'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'roles' => $user->roles()->get(['roles.id', 'name']),
            ],
        ]);
    }

    /**
     * Delete a user from the current tenant.
     * DELETE /api/users/{user}  — requires owner or admin role
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent self-deletion
        if ($user->id === Auth::id()) {
            return response()->json(['success' => false, 'message' => 'You cannot delete your own account.'], 403);
        }

        // Prevent deleting another owner unless you are also an owner
        if ($user->hasRole('owner') && !Auth::user()->hasRole('owner')) {
            return response()->json(['success' => false, 'message' => 'Only owners can remove other owners.'], 403);
        }

        $user->delete();

        return response()->json(['success' => true, 'message' => 'User deleted successfully.']);
    }

    /**
     * Filter users by role name.
     * GET /api/users/by-role?role=cashier
     */
    public function getUsersByRole(Request $request): JsonResponse
    {
        $validated = $request->validate(['role' => 'required|string']);

        $users = User::whereHas('roles', fn($q) => $q->where('name', $validated['role']))
                     ->with('roles:id,name')
                     ->select('id', 'name', 'email')
                     ->get();

        return response()->json(['success' => true, 'data' => $users]);
    }
}
