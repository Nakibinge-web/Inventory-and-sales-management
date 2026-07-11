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
        $user      = Auth::user();
        $isCashier = $user->roles()->pluck('name')
                         ->intersect(['owner', 'admin', 'manager'])
                         ->isEmpty();

        $query = Sale::with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date', 'desc');

        // Cashiers only see their own sales
        if ($isCashier) {
            $query->where('user_id', $user->id);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
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
        $user      = Auth::user();
        $isCashier = $user->roles()->pluck('name')
                         ->intersect(['owner', 'admin', 'manager'])
                         ->isEmpty();

        // Cashiers can only view their own sales
        if ($isCashier && $sale->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view this sale.'], 403);
        }

        $sale->load(['user', 'customer', 'saleItems.product']);

        return response()->json(['success' => true, 'data' => $sale]);
    }

    public function update(Request $request, Sale $sale): JsonResponse
    {
        $user      = Auth::user();
        $isCashier = $user->roles()->pluck('name')
                         ->intersect(['owner', 'admin', 'manager'])
                         ->isEmpty();

        if ($isCashier && $sale->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to edit this sale.'], 403);
        }

        $validated = $request->validate([
            'payment_method' => 'sometimes|required|in:cash,card,mobile_money,bank_transfer',
            'discount_type'  => 'nullable|in:percent,fixed',
            'discount_amount'=> 'nullable|numeric|min:0',
            'tax_amount'     => 'nullable|numeric|min:0',
            'notes'          => 'nullable|string|max:1000',
        ]);

        // Recalculate total if financial fields changed
        if (isset($validated['discount_amount']) || isset($validated['tax_amount'])) {
            $itemsSubtotal   = $sale->saleItems->sum('subtotal');
            $discountAmount  = $validated['discount_amount'] ?? ($sale->discount_amount ?? 0);
            $taxAmount       = $validated['tax_amount']      ?? ($sale->tax_amount      ?? 0);
            $validated['total_amount'] = max(0, $itemsSubtotal - $discountAmount + $taxAmount);
        }

        $sale->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Sale updated successfully.',
            'data'    => $sale->load(['user', 'customer', 'saleItems.product']),
        ]);
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

    public function getDailyReport(Request $request): JsonResponse
    {
        $validated = $request->validate(['date' => 'required|date']);

        $sales = Sale::whereDate('sale_date', $validated['date'])
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        return response()->json(['success' => true, 'data' => [
            'date'               => $validated['date'],
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'total_profit'       => $totalProfit,
            'total_transactions' => $sales->count(),
            'sales'              => $sales,
        ]]);
    }

    public function getWeeklyReport(Request $request): JsonResponse
    {
        $validated = $request->validate(['date' => 'required|date']);

        $date      = \Carbon\Carbon::parse($validated['date']);
        $weekStart = $date->copy()->startOfWeek(\Carbon\Carbon::MONDAY);
        $weekEnd   = $date->copy()->endOfWeek(\Carbon\Carbon::SUNDAY);

        $sales = Sale::whereBetween('sale_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date')
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        // Daily breakdown within the week
        $byDay = [];
        for ($d = $weekStart->copy(); $d->lte($weekEnd); $d->addDay()) {
            $dayStr   = $d->toDateString();
            $daySales = $sales->filter(fn($s) => \Carbon\Carbon::parse($s->sale_date)->toDateString() === $dayStr);
            $dayCost  = $daySales->sum('cost');
            $byDay[]  = [
                'date'         => $dayStr,
                'day'          => $d->format('D'),
                'total'        => $daySales->sum('total_amount'),
                'cost'         => round($dayCost, 2),
                'profit'       => round($daySales->sum('total_amount') - $dayCost, 2),
                'transactions' => $daySales->count(),
            ];
        }

        return response()->json(['success' => true, 'data' => [
            'week_start'         => $weekStart->toDateString(),
            'week_end'           => $weekEnd->toDateString(),
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'total_profit'       => $totalProfit,
            'total_transactions' => $sales->count(),
            'by_day'             => $byDay,
            'sales'              => $sales,
        ]]);
    }

    public function getMonthlySalesReport(Request $request): JsonResponse
    {
        $validated = $request->validate(['month' => 'required|date_format:Y-m']);

        [$year, $month] = explode('-', $validated['month']);

        $sales = Sale::whereYear('sale_date', $year)
                     ->whereMonth('sale_date', $month)
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date')
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        // Day-by-day breakdown
        $daysInMonth = \Carbon\Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $byDay = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayStr   = sprintf('%04d-%02d-%02d', $year, $month, $d);
            $daySales = $sales->filter(fn($s) => \Carbon\Carbon::parse($s->sale_date)->toDateString() === $dayStr);
            if ($daySales->count() > 0) {
                $dayCost = $daySales->sum('cost');
                $byDay[] = [
                    'date'         => $dayStr,
                    'total'        => $daySales->sum('total_amount'),
                    'cost'         => round($dayCost, 2),
                    'profit'       => round($daySales->sum('total_amount') - $dayCost, 2),
                    'transactions' => $daySales->count(),
                ];
            }
        }

        // Payment method breakdown
        $byPayment = $sales->groupBy('payment_method')->map(fn($g) => [
            'method' => $g->first()->payment_method,
            'total'  => $g->sum('total_amount'),
            'profit' => round($g->sum('profit'), 2),
            'count'  => $g->count(),
        ])->values();

        return response()->json(['success' => true, 'data' => [
            'month'              => $validated['month'],
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'total_profit'       => $totalProfit,
            'total_transactions' => $sales->count(),
            'by_day'             => $byDay,
            'by_payment'         => $byPayment,
            'sales'              => $sales,
        ]]);
    }

    public function getYearlyReport(Request $request): JsonResponse
    {
        $validated = $request->validate(['year' => 'required|digits:4|integer|min:2000|max:2100']);
        $year      = (int) $validated['year'];

        $sales = Sale::whereYear('sale_date', $year)
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date')
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        // Month-by-month breakdown
        $byMonth = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthSales = $sales->filter(
                fn($s) => (int) \Carbon\Carbon::parse($s->sale_date)->month === $m
            );
            $monthCost = $monthSales->sum('cost');
            $byMonth[] = [
                'month'        => $m,
                'month_name'   => \Carbon\Carbon::createFromDate($year, $m, 1)->format('M'),
                'total'        => round($monthSales->sum('total_amount'), 2),
                'cost'         => round($monthCost, 2),
                'profit'       => round($monthSales->sum('total_amount') - $monthCost, 2),
                'transactions' => $monthSales->count(),
            ];
        }

        // Quarter breakdown
        $byQuarter = [];
        foreach ([[1,3,'Q1'],[4,6,'Q2'],[7,9,'Q3'],[10,12,'Q4']] as [$from, $to, $label]) {
            $qSales = $sales->filter(
                fn($s) => (int) \Carbon\Carbon::parse($s->sale_date)->month >= $from
                       && (int) \Carbon\Carbon::parse($s->sale_date)->month <= $to
            );
            $qCost = $qSales->sum('cost');
            $byQuarter[] = [
                'quarter'      => $label,
                'total'        => round($qSales->sum('total_amount'), 2),
                'cost'         => round($qCost, 2),
                'profit'       => round($qSales->sum('total_amount') - $qCost, 2),
                'transactions' => $qSales->count(),
            ];
        }

        // Payment method breakdown for the year
        $byPayment = $sales->groupBy('payment_method')->map(fn($g) => [
            'method' => $g->first()->payment_method,
            'total'  => $g->sum('total_amount'),
            'profit' => round($g->sum('profit'), 2),
            'count'  => $g->count(),
        ])->values();

        // Best and worst months
        $bestMonth  = collect($byMonth)->sortByDesc('total')->first();
        $worstMonth = collect($byMonth)->where('transactions', '>', 0)->sortBy('total')->first();

        return response()->json(['success' => true, 'data' => [
            'year'               => $year,
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'total_profit'       => $totalProfit,
            'total_transactions' => $sales->count(),
            'by_month'           => $byMonth,
            'by_quarter'         => $byQuarter,
            'by_payment'         => $byPayment,
            'best_month'         => $bestMonth,
            'worst_month'        => $worstMonth,
        ]]);
    }
}
