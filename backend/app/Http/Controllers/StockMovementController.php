<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockMovementController extends Controller
{
    /**
     * Display stock movements for a specific tenant.
     * GET /api/stock-movements?tenant_id=1
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');
        
        $movements = StockMovement::where('tenant_id', $tenantId)
                                 ->with('product')
                                 ->orderBy('date', 'desc')
                                 ->get();

        return response()->json([
            'success' => true,
            'data' => $movements
        ]);
    }

    /**
     * Display specific stock movement.
     * GET /api/stock-movements/{id}
     */
    public function show(StockMovement $stockMovement): JsonResponse
    {
        $stockMovement->load('product');
        
        return response()->json([
            'success' => true,
            'data' => $stockMovement
        ]);
    }

    /**
     * Get stock movements for a specific product.
     * GET /api/stock-movements/product/{productId}?tenant_id=1
     */
    public function getByProduct(Request $request, $productId): JsonResponse
    {
        $tenantId = $request->query('tenant_id');
        
        $movements = StockMovement::where('tenant_id', $tenantId)
                                 ->where('product_id', $productId)
                                 ->with('product')
                                 ->orderBy('date', 'desc')
                                 ->get();

        return response()->json([
            'success' => true,
            'data' => $movements
        ]);
    }

    /**
     * Get stock movements by type (IN/OUT).
     * GET /api/stock-movements/by-type?tenant_id=1&type=IN
     */
    public function getByType(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'type' => 'required|in:IN,OUT'
        ]);
        
        $movements = StockMovement::where('tenant_id', $validated['tenant_id'])
                                 ->where('type', $validated['type'])
                                 ->with('product')
                                 ->orderBy('date', 'desc')
                                 ->get();

        return response()->json([
            'success' => true,
            'data' => $movements
        ]);
    }

    /**
     * Get stock movements within date range.
     * GET /api/stock-movements/date-range?tenant_id=1&start_date=2026-03-01&end_date=2026-03-31
     */
    public function getByDateRange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date'
        ]);
        
        $movements = StockMovement::where('tenant_id', $validated['tenant_id'])
                                 ->whereBetween('date', [$validated['start_date'], $validated['end_date']])
                                 ->with('product')
                                 ->orderBy('date', 'desc')
                                 ->get();

        return response()->json([
            'success' => true,
            'data' => $movements
        ]);
    }
}