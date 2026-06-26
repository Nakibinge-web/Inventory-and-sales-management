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
        $request->validate([
            'supplier_id'                       => 'required|exists:suppliers,id',
            'items'                             => 'required|array|min:1',
            'items.*.product_id'                => 'nullable|exists:products,id',
            'items.*.quantity'                  => 'required|integer|min:1',
            'items.*.cost_price'                => 'required|numeric|min:0',
            // new product fields (required when product_id is absent)
            'items.*.new_product'               => 'nullable|array',
            'items.*.new_product.name'          => 'required_with:items.*.new_product|string|max:255',
            'items.*.new_product.price'         => 'required_with:items.*.new_product|numeric|min:0',
            'items.*.new_product.sku'           => 'nullable|string|max:100',
            'items.*.new_product.unit'          => 'nullable|string|max:50',
            'items.*.new_product.category_id'   => 'nullable|exists:categories,id',
            'items.*.new_product.reorder_level' => 'nullable|numeric|min:0',
        ]);

        $items      = $request->input('items');
        $supplierId = $request->input('supplier_id');
        $tenantId   = auth()->user()->tenant_id;

        // Validate: every item must have either product_id or new_product.name
        foreach ($items as $index => $item) {
            if (empty($item['product_id']) && empty($item['new_product']['name'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Item #" . ($index + 1) . " must have either an existing product or a new product name.",
                ], 422);
            }
        }

        return DB::transaction(function () use ($items, $supplierId, $tenantId) {
            $newlyCreatedProducts = [];

            // Resolve product IDs — create new products where needed
            foreach ($items as &$item) {
                if (empty($item['product_id']) && !empty($item['new_product'])) {
                    $np = $item['new_product'];
                    $product = Product::create([
                        'tenant_id'     => $tenantId,
                        'name'          => $np['name'],
                        'sku'           => $np['sku'] ?? null,
                        'unit'          => $np['unit'] ?? null,
                        'category_id'   => $np['category_id'] ?? null,
                        'supplier_id'   => $supplierId,
                        'stock'         => 0, // will be incremented below
                        'cost_price'    => $item['cost_price'],
                        'price'         => $np['price'],
                        'reorder_level' => $np['reorder_level'] ?? 0,
                    ]);
                    $item['product_id'] = $product->id;
                    $newlyCreatedProducts[] = $product->load(['category', 'supplier']);
                }
            }
            unset($item);

            $totalAmount = array_sum(array_map(fn($i) => $i['quantity'] * $i['cost_price'], $items));

            $purchase = Purchase::create([
                'supplier_id'   => $supplierId,
                'total_amount'  => $totalAmount,
                'purchase_date' => now(),
            ]);

            foreach ($items as $item) {
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

            return response()->json([
                'success'              => true,
                'message'              => 'Purchase recorded successfully',
                'data'                 => $purchase,
                'new_products'         => $newlyCreatedProducts,
            ], 201);
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
