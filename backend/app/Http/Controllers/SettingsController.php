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
        $tenantId = $request->tenant_id ?? $request->user()?->tenant_id;
        $tenant = Tenant::find($tenantId);
        
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
                'logo_path' => $tenant->logo_path,
                'logo_url' => $tenant->logo_url,
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
        $tenantId = $request->tenant_id ?? $request->user()?->tenant_id;
        $tenant = Tenant::find($tenantId);
        
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
            'logo' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp|max:5120',
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

        if ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            if ($tenant->logo_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($tenant->logo_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($tenant->logo_path);
            }
            $updateData['logo_path'] = $request->file('logo')->store('logos', 'public');
        } elseif ($request->filled('logo') && is_string($request->logo) && str_starts_with($request->logo, 'data:image/')) {
            try {
                preg_match('/^data:image\/(\w+);base64,/', $request->logo, $type);
                $image = substr($request->logo, strpos($request->logo, ',') + 1);
                $type = strtolower($type[1] ?? 'png');
                $decoded = base64_decode($image);
                if ($decoded !== false) {
                    if ($tenant->logo_path && \Illuminate\Support\Facades\Storage::disk('public')->exists($tenant->logo_path)) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($tenant->logo_path);
                    }
                    $fileName = 'logos/' . \Illuminate\Support\Str::random(40) . '.' . $type;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($fileName, $decoded);
                    $updateData['logo_path'] = $fileName;
                }
            } catch (\Throwable $e) {}
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
                'logo_path' => $tenant->logo_path,
                'logo_url' => $tenant->logo_url,
                'updated_at' => $tenant->updated_at,
            ]
        ]);
    }
}
