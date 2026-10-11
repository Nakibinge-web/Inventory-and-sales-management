<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TenantController extends Controller
{
    /**
     * Display a listing of all tenants.
     * GET /api/tenants
     */
    public function index(): JsonResponse
    {
        $tenants = Tenant::all();
        return response()->json([
            'success' => true,
            'data' => $tenants
        ]);
    }

    /**
     * Store a newly created tenant (business registration).
     * POST /api/tenants
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:tenants,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120'
        ]);

        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            $validated['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        $tenant = Tenant::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Business registered successfully',
            'data' => $tenant
        ], 201);
    }

    /**
     * Display the specified tenant.
     * GET /api/tenants/{id}
     */
    public function show(Tenant $tenant): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $tenant
        ]);
    }

    /**
     * Update the specified tenant.
     * PUT /api/tenants/{id}
     */
    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:tenants,email,' . $tenant->id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120'
        ]);

        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            if ($tenant->logo_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($tenant->logo_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($tenant->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Business updated successfully',
            'data' => $tenant
        ]);
    }

    /**
     * Remove the specified tenant.
     * DELETE /api/tenants/{id}
     */
    public function destroy(Tenant $tenant): JsonResponse
    {
        $tenant->delete();

        return response()->json([
            'success' => true,
            'message' => 'Business deleted successfully'
        ]);
    }
}