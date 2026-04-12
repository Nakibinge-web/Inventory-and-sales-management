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
    public function index(): JsonResponse
    {
        $purchases = Purchase::with(['supplier', 'purchaseItems.product'])->orderBy('purchase_date', 'desc')->get();

        return response()->json(['success' => true, 'data' => $purchases]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_id'              => 'required|exists:suppliers,id',
            'items'                    => 'required|array|min:1',
            'items.*.product_id'       => 'required|exists:products,id',
            'items.*.quantity'         => 'required|integer|min:1',
            'items.*.cost_price'       => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $totalAmount = array_sum(array_map(fn($i) => $i['quantity'] * $i['cost_price'], $validated['items']));

            $purchase = Purchase::create([
                'supplier_id'   => $validated['supplier_id'],
                'total_amount'  => $totalAmount,
                'purchase_date' => now(),
            ]);

            foreach ($validated['items'] as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['product_id'],
                    'quantity'    => $item['quantity'],
                    'cost_price'  => $item['cost_price'],
                ]);

                Product::findOrFail($item['product_id'])->increment('stock', $item['quantity']);

                StockMovement::create([
                    'product_id'     => $item['product_id'],
                    'type'           => 'IN',
                    'quantity'       => $item['quantity'],
                    'reference_id'   => $purchase->id,
                    'reference_type' => 'purchase',
                    'date'           => now(),
                ]);
            }

            $purchase->load(['supplier', 'purchaseItems.product']);

            return response()->json(['success' => true, 'message' => 'Purchase recorded successfully', 'data' => $purchase], 201);
        });
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $purchase->load(['supplier', 'purchaseItems.product']);

        return response()->json(['success' => true, 'data' => $purchase]);
    }

    public function getMonthlyReport(Request $request): JsonResponse
    {
        $validated = $request->validate(['month' => 'required|date_format:Y-m']);

        [$year, $month] = explode('-', $validated['month']);

        $purchases = Purchase::whereYear('purchase_date', $year)
                             ->whereMonth('purchase_date', $month)
                             ->with(['supplier', 'purchaseItems.product'])
                             ->get();

        return response()->json(['success' => true, 'data' => [
            'month'              => $validated['month'],
            'total_purchases'    => $purchases->sum('total_amount'),
            'total_transactions' => $purchases->count(),
            'purchases'          => $purchases,
        ]]);
    }
}
