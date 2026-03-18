<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    /**
     * Display sales for a specific tenant.
     * GET /api/sales?tenant_id=1
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->query('tenant_id');
        
        $sales = Sale::where('tenant_id', $tenantId)
                    ->with(['user', 'saleItems.product'])
                    ->orderBy('sale_date', 'desc')
                    ->get();

        return response()->json([
            'success' => true,
            'data' => $sales
        ]);
    }

    /**
     * Create a new sale transaction.
     * POST /api/sales
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'user_id' => 'required|exists:users,id',
            'payment_method' => 'required|in:cash,card,mobile_money,bank_transfer',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0'
        ]);

        return DB::transaction(function () use ($validated) {
            // Calculate total amount
            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['quantity'] * $item['price'];
            }

            // Create sale record
            $sale = Sale::create([
                'tenant_id' => $validated['tenant_id'],
                'user_id' => $validated['user_id'],
                'total_amount' => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'sale_date' => now()
            ]);

            // Process each sale item
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                
                // Check stock availability
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }

                // Create sale item
                SaleItem::create([
                    'tenant_id' => $validated['tenant_id'],
                    'sale_id' => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'subtotal' => $item['quantity'] * $item['price']
                ]);

                // Update product stock
                $product->decrement('stock', $item['quantity']);

                // Record stock movement
                StockMovement::create([
                    'tenant_id' => $validated['tenant_id'],
                    'product_id' => $item['product_id'],
                    'type' => 'OUT',
                    'quantity' => $item['quantity'],
                    'reference_id' => $sale->id,
                    'reference_type' => 'sale',
                    'date' => now()
                ]);
            }

            $sale->load(['user', 'saleItems.product']);

            return response()->json([
                'success' => true,
                'message' => 'Sale completed successfully',
                'data' => $sale
            ], 201);
        });
    }

    /**
     * Display specific sale.
     * GET /api/sales/{id}
     */
    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['user', 'saleItems.product']);
        
        return response()->json([
            'success' => true,
            'data' => $sale
        ]);
    }

    /**
     * Get daily sales report.
     * GET /api/sales/daily-report?tenant_id=1&date=2026-03-18
     */
    public function getDailyReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'date' => 'required|date'
        ]);

        $sales = Sale::where('tenant_id', $validated['tenant_id'])
                    ->whereDate('sale_date', $validated['date'])
                    ->with(['user', 'saleItems.product'])
                    ->get();

        $totalSales = $sales->sum('total_amount');
        $totalTransactions = $sales->count();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $validated['date'],
                'total_sales' => $totalSales,
                'total_transactions' => $totalTransactions,
                'sales' => $sales
            ]
        ]);
    }
}