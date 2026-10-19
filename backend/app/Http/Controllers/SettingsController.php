<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
                'signature_path' => $tenant->signature_path,
                'signature_url' => $tenant->signature_url,
                'tagline' => $tenant->tagline,
                'tin' => $tenant->tin,
                'website' => $tenant->website,
                'bank_name' => $tenant->bank_name,
                'account_name' => $tenant->account_name,
                'account_number' => $tenant->account_number,
                'mobile_money_number' => $tenant->mobile_money_number,
                'mobile_money_name' => $tenant->mobile_money_name,
                'payment_terms' => $tenant->payment_terms,
                'invoice_notes' => $tenant->invoice_notes,
                'enabled_modules' => $tenant->enabled_modules,
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
            'phone' => 'nullable|string|max:50',
            'contacts' => 'nullable|array',
            'contacts.*.type' => 'required|string|max:50',
            'contacts.*.number' => 'required|string|max:50',
            'address' => 'nullable|string',
            'tagline' => 'nullable|string|max:255',
            'tin' => 'nullable|string|max:100',
            'website' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'mobile_money_number' => 'nullable|string|max:100',
            'mobile_money_name' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:255',
            'invoice_notes' => 'nullable|string',
            'enabled_modules' => 'nullable|array',
            'logo' => 'nullable',
            'signature' => 'nullable',
            'remove_logo' => 'nullable|boolean',
            'remove_signature' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $fields = [
            'name', 'email', 'phone', 'address', 'tagline', 'tin', 'website',
            'bank_name', 'account_name', 'account_number',
            'mobile_money_number', 'mobile_money_name',
            'payment_terms', 'invoice_notes', 'enabled_modules'
        ];

        $updateData = [];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $updateData[$field] = $request->input($field);
            }
        }
        
        // Handle contacts separately to ensure proper array format
        if ($request->has('contacts')) {
            $contacts = $request->input('contacts');
            $updateData['contacts'] = is_array($contacts) ? array_values($contacts) : [];
        }

        // Handle Logo Removal or Upload
        if ($request->boolean('remove_logo') || $request->input('remove_logo') === true) {
            if ($tenant->logo_path && Storage::disk('public')->exists($tenant->logo_path)) {
                Storage::disk('public')->delete($tenant->logo_path);
            }
            $updateData['logo_path'] = null;
        } elseif ($request->hasFile('logo') && $request->file('logo')->isValid()) {
            if ($tenant->logo_path && Storage::disk('public')->exists($tenant->logo_path)) {
                Storage::disk('public')->delete($tenant->logo_path);
            }
            $updateData['logo_path'] = $request->file('logo')->store('logos', 'public');
        } elseif ($request->filled('logo') && is_string($request->logo) && str_starts_with($request->logo, 'data:image/')) {
            try {
                preg_match('/^data:image\/(\w+);base64,/', $request->logo, $type);
                $image = substr($request->logo, strpos($request->logo, ',') + 1);
                $type = strtolower($type[1] ?? 'png');
                $decoded = base64_decode($image);
                if ($decoded !== false) {
                    if ($tenant->logo_path && Storage::disk('public')->exists($tenant->logo_path)) {
                        Storage::disk('public')->delete($tenant->logo_path);
                    }
                    $fileName = 'logos/' . Str::random(40) . '.' . $type;
                    Storage::disk('public')->put($fileName, $decoded);
                    $updateData['logo_path'] = $fileName;
                }
            } catch (\Throwable $e) {}
        }

        // Handle Digital Signature Removal or Upload
        if ($request->boolean('remove_signature') || $request->input('remove_signature') === true) {
            if ($tenant->signature_path && Storage::disk('public')->exists($tenant->signature_path)) {
                Storage::disk('public')->delete($tenant->signature_path);
            }
            $updateData['signature_path'] = null;
        } elseif ($request->hasFile('signature') && $request->file('signature')->isValid()) {
            if ($tenant->signature_path && Storage::disk('public')->exists($tenant->signature_path)) {
                Storage::disk('public')->delete($tenant->signature_path);
            }
            $updateData['signature_path'] = $request->file('signature')->store('signatures', 'public');
        } elseif ($request->filled('signature') && is_string($request->signature) && str_starts_with($request->signature, 'data:image/')) {
            try {
                preg_match('/^data:image\/(\w+);base64,/', $request->signature, $type);
                $image = substr($request->signature, strpos($request->signature, ',') + 1);
                $type = strtolower($type[1] ?? 'png');
                $decoded = base64_decode($image);
                if ($decoded !== false) {
                    if ($tenant->signature_path && Storage::disk('public')->exists($tenant->signature_path)) {
                        Storage::disk('public')->delete($tenant->signature_path);
                    }
                    $fileName = 'signatures/' . Str::random(40) . '.' . $type;
                    Storage::disk('public')->put($fileName, $decoded);
                    $updateData['signature_path'] = $fileName;
                }
            } catch (\Throwable $e) {}
        }

        $tenant->update($updateData);
        $tenant->refresh();

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
                'signature_path' => $tenant->signature_path,
                'signature_url' => $tenant->signature_url,
                'tagline' => $tenant->tagline,
                'tin' => $tenant->tin,
                'website' => $tenant->website,
                'bank_name' => $tenant->bank_name,
                'account_name' => $tenant->account_name,
                'account_number' => $tenant->account_number,
                'mobile_money_number' => $tenant->mobile_money_number,
                'mobile_money_name' => $tenant->mobile_money_name,
                'payment_terms' => $tenant->payment_terms,
                'invoice_notes' => $tenant->invoice_notes,
                'enabled_modules' => $tenant->enabled_modules,
                'updated_at' => $tenant->updated_at,
            ]
        ]);
    }

    /**
     * Update the current tenant's enabled modules
     */
    public function updateModules(Request $request)
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
            'enabled_modules' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $modules = $request->input('enabled_modules', []);
        $current = $tenant->enabled_modules ?? Tenant::DEFAULT_MODULES;
        $merged = array_merge($current, $modules);

        $tenant->update(['enabled_modules' => $merged]);
        $tenant->refresh();

        return response()->json([
            'success' => true,
            'message' => 'System modules updated successfully',
            'data' => [
                'enabled_modules' => $tenant->enabled_modules
            ]
        ]);
    }
}
