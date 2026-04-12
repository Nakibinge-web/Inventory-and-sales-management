<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StockMovementController extends Controller
{
    public function index(): JsonResponse
    {
        $movements = StockMovement::with('product')->orderBy('date', 'desc')->get();

        return response()->json(['success' => true, 'data' => $movements]);
    }

    public function show(StockMovement $stockMovement): JsonResponse
    {
        $stockMovement->load('product');

        return response()->json(['success' => true, 'data' => $stockMovement]);
    }

    public function getByProduct(Request $request, $productId): JsonResponse
    {
        $movements = StockMovement::where('product_id', $productId)
                                  ->with('product')
                                  ->orderBy('date', 'desc')
                                  ->get();

        return response()->json(['success' => true, 'data' => $movements]);
    }

    public function getByType(Request $request): JsonResponse
    {
        $validated = $request->validate(['type' => 'required|in:IN,OUT']);

        $movements = StockMovement::where('type', $validated['type'])
                                  ->with('product')
                                  ->orderBy('date', 'desc')
                                  ->get();

        return response()->json(['success' => true, 'data' => $movements]);
    }

    public function getByDateRange(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after_or_equal:start_date',
        ]);

        $movements = StockMovement::whereBetween('date', [$validated['start_date'], $validated['end_date']])
                                  ->with('product')
                                  ->orderBy('date', 'desc')
                                  ->get();

        return response()->json(['success' => true, 'data' => $movements]);
    }
}
