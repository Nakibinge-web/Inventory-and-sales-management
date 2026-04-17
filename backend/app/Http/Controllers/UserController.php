<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::with('roles:id,name')->select('id', 'name', 'email', 'created_at')->get();

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'role_ids' => 'required|array|min:1',
            'role_ids.*' => 'exists:roles,id',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        $user->roles()->attach($validated['role_ids']);

        return response()->json(['success' => true, 'message' => 'User created successfully', 'data' => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'roles' => $user->roles()->get(['id', 'name']),
        ]], 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load('roles:id,name');

        return response()->json(['success' => true, 'data' => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
            'roles' => $user->roles, 'tenant' => $user->tenant->name, 'created_at' => $user->created_at,
        ]]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|string|min:8',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json(['success' => true, 'message' => 'User updated successfully', 'data' => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email,
        ]]);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(['success' => true, 'message' => 'User deleted successfully']);
    }

    public function getUsersByRole(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'role' => 'required|string',
        ]);

        $users = User::whereHas('roles', fn($q) => $q->where('name', $validated['role']))
                     ->with('roles:id,name')
                     ->select('id', 'name', 'email')
                     ->get();

        return response()->json(['success' => true, 'data' => $users]);
    }
}
