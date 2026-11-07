<?php

namespace App\Http\Controllers;

use App\Models\GeneratedReport;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class GeneratedReportController extends Controller
{
    private function authorizePermission()
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $isOwnerOrAdmin = $user->roles()->whereIn('name', ['owner', 'admin'])->exists();
        if (!$isOwnerOrAdmin && !$user->hasPermission('reports.configure_automation') && !$user->hasPermission('sales.report')) {
            abort(403, 'You do not have permission to view generated reports.');
        }

        return $user;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $this->authorizePermission();

        // Strict Tenant Isolation: Only get reports for this tenant
        $query = GeneratedReport::where('tenant_id', $user->tenant_id)
            ->orderBy('generated_at', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('report_type') && $request->report_type !== 'all') {
            $query->where('report_type', $request->report_type);
        }

        if ($request->filled('date')) {
            $query->whereDate('generated_at', $request->date);
        }

        $limit = $request->input('limit', 100);
        $reports = $query->limit($limit)->get();

        return response()->json([
            'success' => true,
            'data'    => $reports,
        ]);
    }

    public function show($id): JsonResponse
    {
        $user = $this->authorizePermission();

        // Strict Tenant Isolation: Ensure report belongs to this tenant
        $report = GeneratedReport::where('tenant_id', $user->tenant_id)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $report,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $user = $this->authorizePermission();

        // Strict Tenant Isolation: Only allow deleting this tenant's report
        $report = GeneratedReport::where('tenant_id', $user->tenant_id)->findOrFail($id);
        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Generated report deleted successfully.',
        ]);
    }
}
