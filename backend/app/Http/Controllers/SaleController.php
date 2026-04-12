<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(): JsonResponse
    {
        $sales = Sale::with(['user', 'saleItems.product'])->orderBy('sale_date', 'desc')->get();

        return response()->json(['success' => true, 'data' => $sales]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_method'         => 'required|in:cash,card,mobile_money,bank_transfer',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.price'          => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $totalAmount = array_sum(array_map(fn($i) => $i['quantity'] * $i['price'], $validated['items']));

            $sale = Sale::create([
                'user_id'        => Auth::id(),
                'total_amount'   => $totalAmount,
                'payment_method' => $validated['payment_method'],
                'sale_date'      => now(),
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }

                SaleItem::create([
                    'sale_id'    => $sale->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'price'      => $item['price'],
                    'subtotal'   => $item['quantity'] * $item['price'],
                ]);

                $product->decrement('stock', $item['quantity']);

                StockMovement::create([
                    'product_id'     => $item['product_id'],
                    'type'           => 'OUT',
                    'quantity'       => $item['quantity'],
                    'reference_id'   => $sale->id,
                    'reference_type' => 'sale',
                    'date'           => now(),
                ]);
            }

            $sale->load(['user', 'saleItems.product']);

            return response()->json(['success' => true, 'message' => 'Sale completed successfully', 'data' => $sale], 201);
        });
    }

    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['user', 'saleItems.product']);

        return response()->json(['success' => true, 'data' => $sale]);
    }

    public function getDailyReport(Request $request): JsonResponse
    {
        $validated = $request->validate(['date' => 'required|date']);

        $sales = Sale::whereDate('sale_date', $validated['date'])
                     ->with(['user', 'saleItems.product'])
                     ->get();

        return response()->json(['success' => true, 'data' => [
            'date'               => $validated['date'],
            'total_sales'        => $sales->sum('total_amount'),
            'total_transactions' => $sales->count(),
            'sales'              => $sales,
        ]]);
    }
}
