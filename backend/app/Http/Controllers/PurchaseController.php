<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Display purchases for a specific tenant.
     * GET /api/purchases?tenant_id=1
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');
        
        $purchases = Purchase::where('tenant_id', $tenantId)
                            ->with(['supplier', 'purchaseItems.product'])
                            ->orderBy('purchase_date', 'desc')
                            ->get();

        return response()->json([
            'success' => true,
            'data' => $purchases
        ]);
    }

    /**
     * Create a new purchase transaction.
     * POST /api/purchases
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost_price' => 'required|numeric|min:0'
        ]);

        return DB::transaction(function () use ($validated) {
            // Calculate total amount
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['cost_price'];
            }

            // Create purchase record
            $purchase = Purchase::create([
                'tenant_id' => $validated['tenant_id'],
                'supplier_id' => $validated['supplier_id'],
                'total_amount' => $totalAmount,
                'purchase_date' => now()
            ]);

            // Process each purchase item
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);

                // Create purchase item
                PurchaseItem::create([
                    'tenant_id' => $validated['tenant_id'],
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price']
                ]);

                // Update product stock
                $product->increment('stock', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'tenant_id' => $validated['tenant_id'],
                    'product_id' => $item['product_id'],
                    'type' => 'IN',
                    'quantity' => $item['quantity'],
                    'reference_id' => $purchase->id,
                    'reference_type' => 'purchase',
                    'date' => now()
                ]);
            }

            $purchase->load(['supplier', 'purchaseItems.product']);

            return response()->json([
                'success' => true,
                'message' => 'Purchase recorded successfully',
                'data' => $purchase
            ], 201);
        });
    }

    /**
     * Display specific purchase.
     * GET /api/purchases/{id}
     */
    public function show(Purchase $purchase): JsonResponse
    {
        $purchase->load(['supplier', 'purchaseItems.product']);
        
        return response()->json([
            'success' => true,
            'data' => $purchase
        ]);
    }

    /**
     * Get monthly purchase report.
     * GET /api/purchases/monthly-report?tenant_id=1&month=2026-03
     */
    public function getMonthlyReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'month' => 'required|date_format:Y-m'
        ]);

        $purchases = Purchase::where('tenant_id', $validated['tenant_id'])
                            ->whereYear('purchase_date', substr($validated['month'], 0, 4))
                            ->whereMonth('purchase_date', substr($validated['month'], 5, 2))
                            ->with(['supplier', 'purchaseItems.product'])
                            ->get();

        $totalPurchases = $purchases->sum('total_amount');
        $totalTransactions = $purchases->count();

        return response()->json([
            'success' => true,
            'data' => [
                'month' => $validated['month'],
                'total_purchases' => $totalPurchases,
                'total_transactions' => $totalTransactions,
                'purchases' => $purchases
            ]
        ]);
    }
}