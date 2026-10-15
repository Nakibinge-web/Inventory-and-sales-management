<?php

namespace App\Http\Controllers;

use App\Models\ReportPreference;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class ReportPreferenceController extends Controller
{
    private function authorizePermission()
    {
        if (!Auth::user()->hasPermission('reports.configure_automation')) {
            abort(403, 'You do not have permission to configure automated reports.');
        }
    }

    public function index(): JsonResponse
    {
        $this->authorizePermission();
        
        // BelongsToTenant scope automatically limits this to the current tenant
        return response()->json(['success' => true, 'data' => ReportPreference::all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorizePermission();

        $validated = $request->validate([
            'report_type'     => ['required', Rule::in([
                'daily_sales', 'weekly_sales', 'monthly_sales', 'yearly_sales',
                'daily_purchases', 'monthly_purchases'
            ])],
            'frequency'       => ['required', Rule::in(['daily', 'weekly', 'monthly'])],
            'is_enabled'      => 'boolean',
            'delivery_method' => ['required', Rule::in(['email', 'dashboard'])],
            'recipient_email' => 'nullable|email',
        ]);

        // Duplicate protection
        if (ReportPreference::where('report_type', $validated['report_type'])->exists()) {
            return response()->json(['success' => false, 'message' => 'Preference already exists for this report type.'], 409);
        }

        $preference = ReportPreference::create($validated);

        return response()->json(['success' => true, 'data' => $preference], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $this->authorizePermission();

        $preference = ReportPreference::findOrFail($id);

        $validated = $request->validate([
            'frequency'       => ['sometimes', Rule::in(['daily', 'weekly', 'monthly'])],
            'is_enabled'      => 'sometimes|boolean',
            'delivery_method' => ['sometimes', Rule::in(['email', 'dashboard'])],
            'recipient_email' => 'nullable|email',
        ]);

        $preference->update($validated);

        return response()->json(['success' => true, 'data' => $preference]);
    }

    public function destroy($id): JsonResponse
    {
        $this->authorizePermission();

        $preference = ReportPreference::findOrFail($id);
        $preference->delete();

        return response()->json(['success' => true, 'message' => 'Preference deleted successfully.']);
    }
}
