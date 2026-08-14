<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index(): JsonResponse
    {
        $user = Auth::user();

        // Owners see all sales for the tenant; everyone else only sees their own
        // unless they have a privileged role (manager/admin).
        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        // A custom-role user with sales.view but without a privileged role
        // must have the permission to reach this endpoint.
        if (!$isPrivileged && !$user->hasPermission('sales.view') && !$user->hasRole('cashier')) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view sales.'], 403);
        }

        $query = Sale::with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date', 'desc');

        // Non-privileged users (cashiers and custom-role users with sales.view)
        // can only see their own sales. Owners see everything.
        if (!$isPrivileged) {
            $query->where('user_id', $user->id);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager', 'cashier'])
                            ->isNotEmpty();

        if (!$isPrivileged && !$user->hasPermission('sales.create')) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to create sales.'], 403);
        }

        $validated = $request->validate([
            'payment_method'         => 'required|in:cash,card,mobile_money,bank_transfer',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:products,id',
            'items.*.quantity'       => 'required|integer|min:1',
            'items.*.price'          => 'required|numeric|min:0',
            'customer_type'          => 'nullable|in:walk_in,existing,new',
            'customer_id'            => 'nullable|exists:customers,id',
            'new_customer.name'      => 'required_if:customer_type,new|nullable|string|max:255',
            'new_customer.phone'     => 'nullable|string|max:20',
            'new_customer.email'     => 'nullable|email|max:255',
            'discount_type'          => 'nullable|in:percent,fixed',
            'discount_amount'        => 'nullable|numeric|min:0',
            'tax_amount'             => 'nullable|numeric|min:0',
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                $customerId = null;

                if (($validated['customer_type'] ?? null) === 'new' && !empty($validated['new_customer']['name'])) {
                    $customer = Customer::create([
                        'tenant_id' => Auth::user()->tenant_id,
                        'name'      => $validated['new_customer']['name'],
                        'phone'     => $validated['new_customer']['phone'] ?? null,
                        'email'     => $validated['new_customer']['email'] ?? null,
                        'status'    => 'active',
                    ]);
                    $customerId = $customer->id;
                } elseif (($validated['customer_type'] ?? null) === 'existing') {
                    $customerId = $validated['customer_id'] ?? null;
                }

                $totalAmount = array_sum(array_map(fn($i) => $i['quantity'] * $i['price'], $validated['items']));

                $discountAmount = $validated['discount_amount'] ?? 0;
                $taxAmount      = $validated['tax_amount'] ?? 0;
                $finalTotal     = max(0, $totalAmount - $discountAmount + $taxAmount);

                $sale = Sale::create([
                    'user_id'         => Auth::id(),
                    'customer_id'     => $customerId,
                    'discount_type'   => $validated['discount_type'] ?? null,
                    'discount_amount' => $discountAmount ?: null,
                    'tax_amount'      => $taxAmount ?: null,
                    'total_amount'    => $finalTotal,
                    'payment_method'  => $validated['payment_method'],
                    'sale_date'       => now(),
                ]);

                foreach ($validated['items'] as $item) {
                    // findOrFail scoped by tenant via BelongsToTenant global scope
                    $product = Product::findOrFail($item['product_id']);

                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Insufficient stock for \"{$product->name}\". Available: {$product->stock}, requested: {$item['quantity']}.");
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
                        'tenant_id'      => Auth::user()->tenant_id,
                        'product_id'     => $item['product_id'],
                        'type'           => 'OUT',
                        'quantity'       => $item['quantity'],
                        'reference_id'   => $sale->id,
                        'reference_type' => 'sale',
                        'date'           => now(),
                    ]);
                }

                $sale->load(['user:id,name,email', 'customer:id,name,phone,email', 'saleItems.product:id,name,price']);

                return response()->json(['success' => true, 'message' => 'Sale completed successfully.', 'data' => $sale], 201);
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function show(Sale $sale): JsonResponse
    {
        $user = Auth::user();

        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        $hasViewPermission = $user->hasRole('cashier') || $user->hasPermission('sales.view');

        if (!$isPrivileged && !$hasViewPermission) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view this sale.'], 403);
        }

        // Non-privileged users can only view their own sales
        if (!$isPrivileged && $sale->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view this sale.'], 403);
        }

        $sale->load(['user', 'customer', 'saleItems.product']);

        return response()->json(['success' => true, 'data' => $sale]);
    }

    public function update(Request $request, Sale $sale): JsonResponse
    {
        $user = Auth::user();

        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        // Privileged roles can edit any sale in their tenant.
        // Users with sales.edit permission can only edit their own sales.
        $canEdit = $isPrivileged
            || ($user->hasPermission('sales.edit') && $sale->user_id === $user->id);

        if (!$canEdit) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to edit this sale.'], 403);
        }

        $validated = $request->validate([
            'payment_method'         => 'sometimes|required|in:cash,card,mobile_money,bank_transfer',
            'discount_type'          => 'nullable|in:percent,fixed',
            'discount_amount'        => 'nullable|numeric|min:0',
            'tax_amount'             => 'nullable|numeric|min:0',
            'notes'                  => 'nullable|string|max:1000',
            // Optional full item replacement
            'items'                  => 'sometimes|array|min:1',
            'items.*.product_id'     => 'required_with:items|exists:products,id',
            'items.*.quantity'       => 'required_with:items|integer|min:1',
            'items.*.price'          => 'required_with:items|numeric|min:0',
            // Optional customer update
            'customer_type'          => 'nullable|in:walk_in,existing,new',
            'customer_id'            => 'nullable|exists:customers,id',
            'new_customer.name'      => 'required_if:customer_type,new|nullable|string|max:255',
            'new_customer.phone'     => 'nullable|string|max:20',
            'new_customer.email'     => 'nullable|email|max:255',
        ]);

        try {
            return DB::transaction(function () use ($validated, $request, $sale) {
                // ── Customer update ──────────────────────────────────────
                if (array_key_exists('customer_type', $validated)) {
                    $customerType = $validated['customer_type'];
                    if ($customerType === 'walk_in') {
                        $sale->customer_id = null;
                    } elseif ($customerType === 'existing') {
                        $sale->customer_id = $validated['customer_id'] ?? null;
                    } elseif ($customerType === 'new' && !empty($validated['new_customer']['name'])) {
                        $customer = Customer::create([
                            'tenant_id' => Auth::user()->tenant_id,
                            'name'      => $validated['new_customer']['name'],
                            'phone'     => $validated['new_customer']['phone'] ?? null,
                            'email'     => $validated['new_customer']['email'] ?? null,
                            'status'    => 'active',
                        ]);
                        $sale->customer_id = $customer->id;
                    }
                }

                // ── Item replacement ─────────────────────────────────────
                if (!empty($validated['items'])) {
                    // Restore stock for old items
                    foreach ($sale->saleItems as $oldItem) {
                        $product = Product::find($oldItem->product_id);
                        if ($product) {
                            $product->increment('stock', $oldItem->quantity);
                            StockMovement::create([
                                'tenant_id'      => Auth::user()->tenant_id,
                                'product_id'     => $oldItem->product_id,
                                'type'           => 'IN',
                                'quantity'       => $oldItem->quantity,
                                'reference_id'   => $sale->id,
                                'reference_type' => 'sale',
                                'date'           => now(),
                            ]);
                        }
                    }
                    $sale->saleItems()->delete();

                    // Create new items and deduct stock
                    foreach ($validated['items'] as $item) {
                        $product = Product::findOrFail($item['product_id']);
                        if ($product->stock < $item['quantity']) {
                            throw new \Exception("Insufficient stock for \"{$product->name}\". Available: {$product->stock}, requested: {$item['quantity']}.");
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
                            'tenant_id'      => Auth::user()->tenant_id,
                            'product_id'     => $item['product_id'],
                            'type'           => 'OUT',
                            'quantity'       => $item['quantity'],
                            'reference_id'   => $sale->id,
                            'reference_type' => 'sale',
                            'date'           => now(),
                        ]);
                    }
                }

                // ── Financial fields ─────────────────────────────────────
                $scalarFields = array_intersect_key($validated, array_flip([
                    'payment_method', 'discount_type', 'discount_amount', 'tax_amount', 'notes',
                ]));

                // Recalculate total based on current items after possible replacement
                $sale->refresh();
                $itemsSubtotal  = $sale->saleItems->sum('subtotal');
                $discountAmount = array_key_exists('discount_amount', $scalarFields)
                    ? ($scalarFields['discount_amount'] ?? 0)
                    : ($sale->discount_amount ?? 0);
                $taxAmount = array_key_exists('tax_amount', $scalarFields)
                    ? ($scalarFields['tax_amount'] ?? 0)
                    : ($sale->tax_amount ?? 0);
                $scalarFields['total_amount'] = max(0, $itemsSubtotal - $discountAmount + $taxAmount);

                $sale->fill($scalarFields)->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Sale updated successfully.',
                    'data'    => $sale->load(['user', 'customer', 'saleItems.product']),
                ]);
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function destroy(Sale $sale): JsonResponse
    {
        $user = Auth::user();

        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        // Privileged roles can delete any sale in their tenant.
        // Users with sales.delete permission can only delete their own sales.
        $canDelete = $isPrivileged
            || ($user->hasPermission('sales.delete') && $sale->user_id === $user->id);

        if (!$canDelete) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to delete this sale.'], 403);
        }

        try {
            DB::transaction(function () use ($sale) {
                // Restore stock for each sold item before deleting
                foreach ($sale->saleItems as $item) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->increment('stock', $item->quantity);

                        StockMovement::create([
                            'tenant_id'      => $sale->tenant_id,
                            'product_id'     => $item->product_id,
                            'type'           => 'IN',
                            'quantity'       => $item->quantity,
                            'reference_id'   => $sale->id,
                            'reference_type' => 'sale',
                            'date'           => now(),
                        ]);
                    }
                }

                $sale->saleItems()->delete();
                $sale->delete();
            });
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        return response()->json(['success' => true, 'message' => 'Sale deleted and stock restored successfully.']);
    }

    /**
     * Calculate the total cost and profit for a collection of sales.
     * Cost  = sum of (item.quantity × product.cost_price) across all sale items.
     * Profit = total_sales_amount − total_cost.
     *
     * Returns ['total_cost' => float, 'total_profit' => float, 'sales' => collection with appended cost/profit].
     */
    private function calcProfitForSales($sales): array
    {
        $totalCost = 0;

        $salesWithProfit = $sales->map(function ($sale) use (&$totalCost) {
            $saleCost = $sale->saleItems->sum(function ($item) {
                $costPrice = $item->product?->cost_price ?? 0;
                return $item->quantity * floatval($costPrice);
            });
            $totalCost   += $saleCost;
            $saleProfit   = floatval($sale->total_amount) - $saleCost;
            // Append computed fields without persisting
            $sale->setAttribute('cost',   round($saleCost,   2));
            $sale->setAttribute('profit', round($saleProfit, 2));
            return $sale;
        });

        $totalSales  = $sales->sum('total_amount');
        $totalProfit = floatval($totalSales) - $totalCost;

        return [
            'total_cost'   => round($totalCost,   2),
            'total_profit' => round($totalProfit, 2),
            'sales'        => $salesWithProfit,
        ];
    }

    public function getDailyReport(Request $request, \App\Services\ReportService $reportService): JsonResponse
    {
        $user = Auth::user();
        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        if (!$isPrivileged && !$user->hasPermission('sales.report')) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view sales reports.'], 403);
        }

        $validated = $request->validate(['date' => 'required|date']);

        return response()->json(['success' => true, 'data' => $reportService->getDailySalesReport($validated['date'])]);
    }

    public function getWeeklyReport(Request $request, \App\Services\ReportService $reportService): JsonResponse
    {
        $user = Auth::user();
        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        if (!$isPrivileged && !$user->hasPermission('sales.report')) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view sales reports.'], 403);
        }

        $validated = $request->validate(['date' => 'required|date']);

        return response()->json(['success' => true, 'data' => $reportService->getWeeklySalesReport($validated['date'])]);
    }

    public function getMonthlySalesReport(Request $request, \App\Services\ReportService $reportService): JsonResponse
    {
        $user = Auth::user();
        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        if (!$isPrivileged && !$user->hasPermission('sales.report')) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view sales reports.'], 403);
        }

        $validated = $request->validate(['month' => 'required|date_format:Y-m']);

        return response()->json(['success' => true, 'data' => $reportService->getMonthlySalesReport($validated['month'])]);
    }

    public function getYearlyReport(Request $request, \App\Services\ReportService $reportService): JsonResponse
    {
        $user = Auth::user();
        $isPrivileged = $user->roles()->pluck('name')
                            ->intersect(['owner', 'admin', 'manager'])
                            ->isNotEmpty();

        if (!$isPrivileged && !$user->hasPermission('sales.report')) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view sales reports.'], 403);
        }

        $validated = $request->validate(['year' => 'required|digits:4|integer|min:2000|max:2100']);

        return response()->json(['success' => true, 'data' => $reportService->getYearlySalesReport((int)$validated['year'])]);
    }
}
