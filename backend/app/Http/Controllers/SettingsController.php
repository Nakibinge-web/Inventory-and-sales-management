<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Tenant;

class SettingsController extends Controller
{
    /**
     * Get the current tenant's business information
     */
    public function getBusinessInfo(Request $request)
    {
        $tenant = Tenant::find($request->tenant_id);
        
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'contacts' => $tenant->contacts ?? [],
                'address' => $tenant->address,
                'created_at' => $tenant->created_at,
                'updated_at' => $tenant->updated_at,
            ]
        ]);
    }

    /**
     * Update the current tenant's business information
     */
    public function updateBusinessInfo(Request $request)
    {
        $tenant = Tenant::find($request->tenant_id);
        
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Tenant not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:tenants,email,' . $tenant->id,
            'phone' => 'nullable|string|max:20',
            'contacts' => 'nullable|array',
            'contacts.*.type' => 'required|string|max:50',
            'contacts.*.number' => 'required|string|max:20',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only(['name', 'email', 'phone', 'address']);
        
        // Handle contacts separately to ensure proper JSON encoding
        if ($request->has('contacts')) {
            $updateData['contacts'] = $request->input('contacts');
        }

        $tenant->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Business information updated successfully',
            'data' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'phone' => $tenant->phone,
                'contacts' => $tenant->contacts ?? [],
                'address' => $tenant->address,
                'updated_at' => $tenant->updated_at,
            ]
        ]);
    }
}
