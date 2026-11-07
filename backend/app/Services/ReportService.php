<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Purchase;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class ReportService
{
    /**
     * Helper to calculate profit/cost for a collection of sales.
     *
     * Cost priority per item:
     * 1. Snapshot: sale_items.cost_price (recorded)
     * 2. Fallback: products.cost_price (estimated)
     * 3. Missing:  unavailable (never silently treated as 0)
     */
    public function calcProfitForSales(Collection $sales): array
    {
        $knownCost        = 0.0;
        $estimatedSales   = 0;
        $unavailableSales = 0;

        $salesWithProfit = $sales->map(function ($sale) use (&$knownCost, &$estimatedSales, &$unavailableSales) {
            $saleKnownCost        = 0.0;
            $saleEstimatedItems   = 0;
            $saleUnavailableItems = 0;
            $saleItemCount        = 0;

            foreach ($sale->saleItems as $item) {
                $qty = (int) $item->quantity;
                $saleItemCount++;

                if ($item->cost_price !== null) {
                    $saleKnownCost += $qty * floatval($item->cost_price);
                } elseif ($item->product !== null && $item->product->cost_price !== null) {
                    $saleKnownCost += $qty * floatval($item->product->cost_price);
                    $saleEstimatedItems++;
                } else {
                    $saleUnavailableItems++;
                }
            }

            $knownCost += $saleKnownCost;

            if ($saleUnavailableItems > 0 || $saleItemCount === 0) {
                $saleCostStatus = 'unavailable';
                $saleCost       = null;
                $saleProfit     = null;
                $unavailableSales++;
            } elseif ($saleEstimatedItems > 0) {
                $saleCostStatus = 'estimated';
                $saleCost       = round($saleKnownCost, 2);
                $saleProfit     = round(floatval($sale->total_amount) - $saleKnownCost, 2);
                $estimatedSales++;
            } else {
                $saleCostStatus = 'recorded';
                $saleCost       = round($saleKnownCost, 2);
                $saleProfit     = round(floatval($sale->total_amount) - $saleKnownCost, 2);
            }

            // Append computed fields
            $sale->setAttribute('cost',        $saleCost);
            $sale->setAttribute('known_cost',  round($saleKnownCost, 2));
            $sale->setAttribute('profit',      $saleProfit);
            $sale->setAttribute('cost_status', $saleCostStatus);
            return $sale;
        });

        $totalSales = floatval($sales->sum('total_amount'));

        if ($sales->isEmpty()) {
            $costStatus  = 'no_sales';
            $totalCost   = 0.0;
            $totalProfit = 0.0;
        } elseif ($unavailableSales > 0) {
            $costStatus  = 'unavailable';
            $totalCost   = null;
            $totalProfit = null;
        } elseif ($estimatedSales > 0) {
            $costStatus  = 'estimated';
            $totalCost   = round($knownCost, 2);
            $totalProfit = round($totalSales - $knownCost, 2);
        } else {
            $costStatus  = 'recorded';
            $totalCost   = round($knownCost, 2);
            $totalProfit = round($totalSales - $knownCost, 2);
        }

        return [
            'total_cost'   => $totalCost,
            'known_cost'   => round($knownCost, 2),
            'total_profit' => $totalProfit,
            'cost_status'  => $costStatus,
            'sales'        => $salesWithProfit,
        ];
    }

    /**
     * Helper to summarize cost and profit for a subset of already-annotated sales.
     */
    private function summarizeSubsetSales(Collection $subset): array
    {
        if ($subset->isEmpty()) {
            return [
                'cost'        => 0.0,
                'known_cost'  => 0.0,
                'profit'      => 0.0,
                'cost_status' => 'no_sales',
            ];
        }

        $knownCost      = round(floatval($subset->sum('known_cost')), 2);
        $totalAmount    = floatval($subset->sum('total_amount'));
        $hasUnavailable = $subset->contains(fn($s) => ($s->cost_status ?? null) === 'unavailable' || $s->cost === null);
        $hasEstimated   = $subset->contains(fn($s) => ($s->cost_status ?? null) === 'estimated');

        if ($hasUnavailable) {
            return [
                'cost'        => null,
                'known_cost'  => $knownCost,
                'profit'      => null,
                'cost_status' => 'unavailable',
            ];
        }

        return [
            'cost'        => $knownCost,
            'known_cost'  => $knownCost,
            'profit'      => round($totalAmount - $knownCost, 2),
            'cost_status' => $hasEstimated ? 'estimated' : 'recorded',
        ];
    }

    public function getDailySalesReport(string $date): array
    {
        $sales = Sale::whereDate('sale_date', $date)
                     ->with(['user', 'customer', 'saleItems.product.category'])
                     ->get();

        [
            'total_cost'   => $totalCost,
            'known_cost'   => $knownCost,
            'total_profit' => $totalProfit,
            'cost_status'  => $costStatus,
            'sales'        => $sales,
        ] = $this->calcProfitForSales($sales);

        return [
            'date'               => $date,
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'known_cost'         => $knownCost,
            'total_profit'       => $totalProfit,
            'cost_status'        => $costStatus,
            'total_transactions' => $sales->count(),
            'sales'              => $sales,
        ];
    }

    public function getWeeklySalesReport(string $date): array
    {
        $dateObj   = Carbon::parse($date);
        $weekStart = $dateObj->copy()->startOfWeek(Carbon::MONDAY);
        $weekEnd   = $dateObj->copy()->endOfWeek(Carbon::SUNDAY);

        $sales = Sale::whereDate('sale_date', '>=', $weekStart->toDateString())
                     ->whereDate('sale_date', '<=', $weekEnd->toDateString())
                     ->with(['user', 'customer', 'saleItems.product.category'])
                     ->orderBy('sale_date')
                     ->get();

        [
            'total_cost'   => $totalCost,
            'known_cost'   => $knownCost,
            'total_profit' => $totalProfit,
            'cost_status'  => $costStatus,
            'sales'        => $sales,
        ] = $this->calcProfitForSales($sales);

        $byDay = [];
        for ($d = $weekStart->copy(); $d->lte($weekEnd); $d->addDay()) {
            $dayStr     = $d->toDateString();
            $daySales   = $sales->filter(fn($s) => Carbon::parse($s->sale_date)->toDateString() === $dayStr);
            $daySummary = $this->summarizeSubsetSales($daySales);
            $byDay[]    = [
                'date'         => $dayStr,
                'day'          => $d->format('D'),
                'total'        => $daySales->sum('total_amount'),
                'cost'         => $daySummary['cost'],
                'known_cost'   => $daySummary['known_cost'],
                'profit'       => $daySummary['profit'],
                'cost_status'  => $daySummary['cost_status'],
                'transactions' => $daySales->count(),
            ];
        }

        return [
            'week_start'         => $weekStart->toDateString(),
            'week_end'           => $weekEnd->toDateString(),
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'known_cost'         => $knownCost,
            'total_profit'       => $totalProfit,
            'cost_status'        => $costStatus,
            'total_transactions' => $sales->count(),
            'by_day'             => $byDay,
            'sales'              => $sales,
        ];
    }

    public function getMonthlySalesReport(string $month): array
    {
        [$year, $monthNum] = explode('-', $month);

        $sales = Sale::whereYear('sale_date', $year)
                     ->whereMonth('sale_date', $monthNum)
                     ->with(['user', 'customer', 'saleItems.product.category'])
                     ->orderBy('sale_date')
                     ->get();

        [
            'total_cost'   => $totalCost,
            'known_cost'   => $knownCost,
            'total_profit' => $totalProfit,
            'cost_status'  => $costStatus,
            'sales'        => $sales,
        ] = $this->calcProfitForSales($sales);

        $daysInMonth = Carbon::createFromDate($year, $monthNum, 1)->daysInMonth;
        $byDay = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayStr   = sprintf('%04d-%02d-%02d', $year, $monthNum, $d);
            $daySales = $sales->filter(fn($s) => Carbon::parse($s->sale_date)->toDateString() === $dayStr);
            if ($daySales->count() > 0) {
                $daySummary = $this->summarizeSubsetSales($daySales);
                $byDay[] = [
                    'date'         => $dayStr,
                    'total'        => $daySales->sum('total_amount'),
                    'cost'         => $daySummary['cost'],
                    'known_cost'   => $daySummary['known_cost'],
                    'profit'       => $daySummary['profit'],
                    'cost_status'  => $daySummary['cost_status'],
                    'transactions' => $daySales->count(),
                ];
            }
        }

        $byPayment = $sales->groupBy('payment_method')->map(function ($g) {
            $gSummary = $this->summarizeSubsetSales($g);
            return [
                'method'      => $g->first()->payment_method,
                'total'       => $g->sum('total_amount'),
                'cost'        => $gSummary['cost'],
                'known_cost'  => $gSummary['known_cost'],
                'profit'      => $gSummary['profit'],
                'cost_status' => $gSummary['cost_status'],
                'count'       => $g->count(),
            ];
        })->values();

        return [
            'month'              => $month,
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'known_cost'         => $knownCost,
            'total_profit'       => $totalProfit,
            'cost_status'        => $costStatus,
            'total_transactions' => $sales->count(),
            'by_day'             => $byDay,
            'by_payment'         => $byPayment,
            'sales'              => $sales,
        ];
    }

    public function getYearlySalesReport(int $year): array
    {
        $sales = Sale::whereYear('sale_date', $year)
                     ->with(['user', 'customer', 'saleItems.product.category'])
                     ->orderBy('sale_date')
                     ->get();

        [
            'total_cost'   => $totalCost,
            'known_cost'   => $knownCost,
            'total_profit' => $totalProfit,
            'cost_status'  => $costStatus,
            'sales'        => $sales,
        ] = $this->calcProfitForSales($sales);

        $byMonth = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthSales   = $sales->filter(fn($s) => (int) Carbon::parse($s->sale_date)->month === $m);
            $monthSummary = $this->summarizeSubsetSales($monthSales);
            $byMonth[]    = [
                'month'        => $m,
                'month_name'   => Carbon::createFromDate($year, $m, 1)->format('M'),
                'total'        => round($monthSales->sum('total_amount'), 2),
                'cost'         => $monthSummary['cost'],
                'known_cost'   => $monthSummary['known_cost'],
                'profit'       => $monthSummary['profit'],
                'cost_status'  => $monthSummary['cost_status'],
                'transactions' => $monthSales->count(),
            ];
        }

        $byQuarter = [];
        foreach ([[1,3,'Q1'],[4,6,'Q2'],[7,9,'Q3'],[10,12,'Q4']] as [$from, $to, $label]) {
            $qSales   = $sales->filter(fn($s) => (int) Carbon::parse($s->sale_date)->month >= $from && (int) Carbon::parse($s->sale_date)->month <= $to);
            $qSummary = $this->summarizeSubsetSales($qSales);
            $byQuarter[] = [
                'quarter'      => $label,
                'total'        => round($qSales->sum('total_amount'), 2),
                'cost'         => $qSummary['cost'],
                'known_cost'   => $qSummary['known_cost'],
                'profit'       => $qSummary['profit'],
                'cost_status'  => $qSummary['cost_status'],
                'transactions' => $qSales->count(),
            ];
        }

        $byPayment = $sales->groupBy('payment_method')->map(function ($g) {
            $gSummary = $this->summarizeSubsetSales($g);
            return [
                'method'      => $g->first()->payment_method,
                'total'       => $g->sum('total_amount'),
                'cost'        => $gSummary['cost'],
                'known_cost'  => $gSummary['known_cost'],
                'profit'      => $gSummary['profit'],
                'cost_status' => $gSummary['cost_status'],
                'count'       => $g->count(),
            ];
        })->values();

        $bestMonth  = collect($byMonth)->sortByDesc('total')->first();
        $worstMonth = collect($byMonth)->where('transactions', '>', 0)->sortBy('total')->first();

        return [
            'year'               => $year,
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'known_cost'         => $knownCost,
            'total_profit'       => $totalProfit,
            'cost_status'        => $costStatus,
            'total_transactions' => $sales->count(),
            'by_month'           => $byMonth,
            'by_quarter'         => $byQuarter,
            'by_payment'         => $byPayment,
            'best_month'         => $bestMonth,
            'worst_month'        => $worstMonth,
        ];
    }

    public function getDailyPurchasesReport(string $date): array
    {
        $purchases = Purchase::whereDate('purchase_date', $date)
                             ->with(['supplier', 'purchaseItems.product'])
                             ->orderBy('purchase_date', 'desc')
                             ->get();

        $bySupplier = $purchases->groupBy(fn($p) => $p->supplier?->name ?? 'Unknown')
            ->map(fn($group, $name) => [
                'supplier'           => $name,
                'transactions'       => $group->count(),
                'total_amount'       => $group->sum('total_amount'),
            ])
            ->values();

        return [
            'date'               => $date,
            'total_amount'       => $purchases->sum('total_amount'),
            'total_transactions' => $purchases->count(),
            'total_items'        => $purchases->sum(fn($p) => $p->purchaseItems->count()),
            'by_supplier'        => $bySupplier,
            'purchases'          => $purchases,
        ];
    }

    public function getMonthlyPurchasesReport(string $month): array
    {
        [$year, $monthNum] = explode('-', $month);

        $purchases = Purchase::whereYear('purchase_date', $year)
                             ->whereMonth('purchase_date', $monthNum)
                             ->with(['supplier', 'purchaseItems.product'])
                             ->get();

        return [
            'month'              => $month,
            'total_purchases'    => $purchases->sum('total_amount'),
            'total_transactions' => $purchases->count(),
            'purchases'          => $purchases,
        ];
    }

    public function getOverviewReport(): array
    {
        $sales = Sale::with(['saleItems.product', 'customer'])->get();
        $purchases = Purchase::with(['purchaseItems.product', 'supplier'])->get();
        $products = \App\Models\Product::with('category')->get();
        $customersCount = \App\Models\Customer::count();
        $suppliersCount = \App\Models\Supplier::count();

        [
            'total_cost'   => $totalCost,
            'known_cost'   => $knownCost,
            'total_profit' => $totalProfit,
            'cost_status'  => $costStatus,
        ] = $this->calcProfitForSales($sales);
        $totalSales = $sales->sum('total_amount');
        $totalPurchases = $purchases->sum('total_amount');

        $lowStockCount = $products->filter(fn($p) => $p->stock <= ($p->reorder_level ?? 10))->count();

        // Payment method breakdown
        $byPayment = $sales->groupBy('payment_method')->map(fn($g) => [
            'method' => $g->first()->payment_method ?? 'Unknown',
            'total'  => $g->sum('total_amount'),
            'count'  => $g->count(),
        ])->values()->all();

        // Top products by revenue
        $productRev = [];
        foreach ($sales as $s) {
            foreach ($s->saleItems as $item) {
                $pName = $item->product?->name ?? "Product #{$item->product_id}";
                $productRev[$pName] = ($productRev[$pName] ?? 0) + floatval($item->subtotal ?? 0);
            }
        }
        arsort($productRev);
        $topProducts = [];
        $rank = 1;
        foreach (array_slice($productRev, 0, 5, true) as $pName => $rev) {
            $topProducts[] = [
                'rank' => $rank++,
                'name' => $pName,
                'revenue' => round($rev, 2),
            ];
        }

        // Top suppliers by spend
        $supplierSpend = [];
        foreach ($purchases as $p) {
            $sName = $p->supplier?->name ?? "Supplier #{$p->supplier_id}";
            $supplierSpend[$sName] = ($supplierSpend[$sName] ?? 0) + floatval($p->total_amount ?? 0);
        }
        arsort($supplierSpend);
        $topSuppliers = [];
        $rank = 1;
        foreach (array_slice($supplierSpend, 0, 5, true) as $sName => $spend) {
            $topSuppliers[] = [
                'rank' => $rank++,
                'name' => $sName,
                'spend' => round($spend, 2),
            ];
        }

        return [
            'total_sales' => $totalSales,
            'total_cost' => $totalCost,
            'known_cost' => $knownCost,
            'total_profit' => $totalProfit,
            'cost_status' => $costStatus,
            'total_purchases' => $totalPurchases,
            'net_profit' => $totalSales - $totalPurchases,
            'total_products' => $products->count(),
            'low_stock_count' => $lowStockCount,
            'total_transactions' => $sales->count(),
            'total_purchases_count' => $purchases->count(),
            'customers_count' => $customersCount,
            'suppliers_count' => $suppliersCount,
            'by_payment' => $byPayment,
            'top_products' => $topProducts,
            'top_suppliers' => $topSuppliers,
        ];
    }

    /**
     * Calculate Revenue & Gross Profit Analytics with continuous zero-filled
     * time-series buckets and historical cost accuracy classification.
     *
     * Business formulas:
     * - Gross Item Sales = SUM(sale_items.subtotal)
     * - Raw Discounts = SUM(sales.discount_amount)
     * - Effective Discounts = SUM(MIN(sale_gross_items, sale_discount_amount))
     * - Excess Discounts = SUM(MAX(0, sale_discount_amount - sale_gross_items))
     * - Net Sales Revenue = Gross Item Sales - Effective Discounts = SUM(MAX(0, sale_gross_items - sale_discount_amount))
     * - Tax Collected = SUM(sales.tax_amount) (excluded from revenue, shown separately)
     * - Total Collected = SUM(MAX(0, sale_gross_items - sale_discount_amount + sale_tax_amount)) (reconciles with sales.total_amount)
     * - Gross Profit = Net Sales Revenue - COGS (only when all item costs are available)
     * - Gross Profit Margin = (Gross Profit / Net Sales Revenue) * 100 (when Net Sales Revenue > 0)
     */
    public function getRevenueProfitAnalytics(array $params = []): array
    {
        $tenantId = app()->bound('current_tenant')
            ? app('current_tenant')->id
            : (\Illuminate\Support\Facades\Auth::user()?->tenant_id);

        $year = !empty($params['year']) ? (int) $params['year'] : null;

        if (!empty($params['group_by'])) {
            $groupBy = $params['group_by'];
        } elseif ($year !== null && empty($params['start_date']) && empty($params['end_date'])) {
            $groupBy = 'monthly';
        } else {
            $groupBy = 'daily';
        }

        $now = Carbon::now();

        if (!empty($params['start_date']) && !empty($params['end_date'])) {
            $rangeStart = Carbon::parse($params['start_date'])->startOfDay();
            $rangeEnd   = Carbon::parse($params['end_date'])->endOfDay();
        } elseif ($year !== null) {
            $rangeStart = !empty($params['start_date'])
                ? Carbon::parse($params['start_date'])->startOfDay()
                : Carbon::createFromDate($year, 1, 1)->startOfDay();
            $rangeEnd = !empty($params['end_date'])
                ? Carbon::parse($params['end_date'])->endOfDay()
                : Carbon::createFromDate($year, 12, 31)->endOfDay();
        } elseif (!empty($params['start_date'])) {
            $rangeStart = Carbon::parse($params['start_date'])->startOfDay();
            $rangeEnd   = $now->copy()->endOfDay();
            if ($rangeEnd->lt($rangeStart)) {
                $rangeEnd = $rangeStart->copy()->endOfDay();
            }
        } elseif (!empty($params['end_date'])) {
            $rangeEnd = Carbon::parse($params['end_date'])->endOfDay();
            if ($groupBy === 'monthly') {
                $rangeStart = $rangeEnd->copy()->startOfYear()->startOfDay();
            } elseif ($groupBy === 'weekly') {
                $rangeStart = $rangeEnd->copy()->startOfWeek(Carbon::MONDAY)->subWeeks(11)->startOfDay();
            } else {
                $rangeStart = $rangeEnd->copy()->subDays(29)->startOfDay();
            }
        } else {
            if ($groupBy === 'monthly') {
                $rangeStart = $now->copy()->startOfYear()->startOfDay();
                $rangeEnd   = $now->copy()->endOfYear()->endOfDay();
                $year       = (int) $now->year;
            } elseif ($groupBy === 'weekly') {
                $rangeStart = $now->copy()->startOfWeek(Carbon::MONDAY)->subWeeks(11)->startOfDay();
                $rangeEnd   = $now->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
            } else {
                $rangeStart = $now->copy()->subDays(29)->startOfDay();
                $rangeEnd   = $now->copy()->endOfDay();
            }
        }

        // Build continuous zero-filled buckets clamped to [$rangeStart, $rangeEnd]
        $buckets = [];

        if ($groupBy === 'daily') {
            for ($cursor = $rangeStart->copy()->startOfDay(); $cursor->lte($rangeEnd); $cursor->addDay()) {
                $key = $cursor->toDateString();
                $buckets[$key] = $this->createEmptyAnalyticsBucket(
                    bucketKey: $key,
                    label: $cursor->format('M d, Y'),
                    shortLabel: $cursor->format('M d'),
                    startDate: $key,
                    endDate: $key,
                    extra: [
                        'date'       => $key,
                        'is_partial' => false,
                    ]
                );
            }
        } elseif ($groupBy === 'weekly') {
            $firstMonday = $rangeStart->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
            $lastSunday  = $rangeEnd->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

            for ($cursor = $firstMonday->copy(); $cursor->lte($lastSunday); $cursor->addWeek()) {
                $calStart  = $cursor->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
                $calEnd    = $cursor->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
                $effStart  = $calStart->lt($rangeStart) ? $rangeStart->copy()->startOfDay() : $calStart->copy();
                $effEnd    = $calEnd->gt($rangeEnd) ? $rangeEnd->copy()->endOfDay() : $calEnd->copy();
                $isPartial = !$effStart->isSameDay($calStart) || !$effEnd->isSameDay($calEnd);
                $key       = $calStart->toDateString();

                $label = $effStart->isSameDay($effEnd)
                    ? $effStart->format('M d, Y')
                    : ($effStart->format('M d') . ' - ' . $effEnd->format('M d, Y'));
                $shortLabel = $effStart->isSameDay($effEnd)
                    ? $effStart->format('M d')
                    : ($effStart->format('M d') . '-' . $effEnd->format('M d'));

                $buckets[$key] = $this->createEmptyAnalyticsBucket(
                    bucketKey: $key,
                    label: $label,
                    shortLabel: $shortLabel,
                    startDate: $effStart->toDateString(),
                    endDate: $effEnd->toDateString(),
                    extra: [
                        'week_start'          => $effStart->toDateString(),
                        'week_end'            => $effEnd->toDateString(),
                        'calendar_week_start' => $calStart->toDateString(),
                        'calendar_week_end'   => $calEnd->toDateString(),
                        'is_partial'          => $isPartial,
                    ]
                );
            }
        } else {
            // monthly
            $firstMonth = $rangeStart->copy()->startOfMonth()->startOfDay();
            $lastMonth  = $rangeEnd->copy()->endOfMonth()->endOfDay();

            for ($cursor = $firstMonth->copy(); $cursor->lte($lastMonth); $cursor->addMonth()) {
                $calStart  = $cursor->copy()->startOfMonth()->startOfDay();
                $calEnd    = $cursor->copy()->endOfMonth()->endOfDay();
                $effStart  = $calStart->lt($rangeStart) ? $rangeStart->copy()->startOfDay() : $calStart->copy();
                $effEnd    = $calEnd->gt($rangeEnd) ? $rangeEnd->copy()->endOfDay() : $calEnd->copy();
                $isPartial = !$effStart->isSameDay($calStart) || !$effEnd->isSameDay($calEnd);
                $key       = $calStart->format('Y-m');

                if ($isPartial) {
                    $label = $effStart->isSameDay($effEnd)
                        ? $effStart->format('M d, Y')
                        : ($effStart->format('M d') . ' - ' . $effEnd->format('M d, Y'));
                    $shortLabel = $effStart->isSameDay($effEnd)
                        ? $effStart->format('M d')
                        : ($effStart->format('M d') . '-' . $effEnd->format('d'));
                } else {
                    $label      = $calStart->format('M Y');
                    $shortLabel = $calStart->format('M');
                }

                $buckets[$key] = $this->createEmptyAnalyticsBucket(
                    bucketKey: $key,
                    label: $label,
                    shortLabel: $shortLabel,
                    startDate: $effStart->toDateString(),
                    endDate: $effEnd->toDateString(),
                    extra: [
                        'month'                => $key,
                        'month_number'         => (int) $calStart->format('n'),
                        'month_name'           => $calStart->format('M'),
                        'calendar_month_start' => $calStart->toDateString(),
                        'calendar_month_end'   => $calEnd->toDateString(),
                        'is_partial'           => $isPartial,
                    ]
                );
            }
        }

        // Query tenant-isolated sales within the selected date range
        $salesQuery = Sale::whereDate('sale_date', '>=', $rangeStart->toDateString())
            ->whereDate('sale_date', '<=', $rangeEnd->toDateString())
            ->with(['saleItems.product'])
            ->orderBy('sale_date', 'asc');

        if ($tenantId !== null) {
            $salesQuery->where('tenant_id', $tenantId);
        }

        $sales = $salesQuery->get();

        // Summary accumulators
        $totalGrossItemSales   = 0.0;
        $totalRawDiscounts     = 0.0;
        $totalEffectiveDisc    = 0.0;
        $totalExcessDisc       = 0.0;
        $totalNetRevenue       = 0.0;
        $totalTaxCollected     = 0.0;
        $totalCollected        = 0.0;
        $totalKnownCogs        = 0.0;
        $totalRecordedCogs     = 0.0;
        $totalEstimatedCogs    = 0.0;
        $totalTransactions     = 0;
        $totalItemsCount       = 0;
        $totalRecordedItems    = 0;
        $totalEstimatedItems   = 0;
        $totalUnavailableItems = 0;
        $totalRecordedSales    = 0;
        $totalEstimatedSales   = 0;
        $totalUnavailableSales = 0;

        foreach ($sales as $sale) {
            if ($tenantId !== null && (int) $sale->tenant_id !== (int) $tenantId) {
                continue;
            }

            $saleDate = Carbon::parse($sale->sale_date);
            if ($groupBy === 'daily') {
                $bucketKey = $saleDate->toDateString();
            } elseif ($groupBy === 'weekly') {
                $bucketKey = $saleDate->copy()->startOfWeek(Carbon::MONDAY)->toDateString();
            } else {
                $bucketKey = $saleDate->format('Y-m');
            }

            $saleGrossItems = 0.0;
            $saleKnownCogs  = 0.0;
            $saleRecCogs    = 0.0;
            $saleEstCogs    = 0.0;
            $saleRecItems   = 0;
            $saleEstItems   = 0;
            $saleUnavItems  = 0;
            $saleItemCount  = 0;

            foreach ($sale->saleItems as $item) {
                if ($tenantId !== null && $item->tenant_id !== null && (int) $item->tenant_id !== (int) $tenantId) {
                    continue;
                }

                $qty            = (int) $item->quantity;
                $itemSubtotal   = floatval($item->subtotal);
                $saleGrossItems += $itemSubtotal;
                $saleItemCount++;

                if ($item->cost_price !== null) {
                    $unitCost      = floatval($item->cost_price);
                    $itemCost      = $qty * $unitCost;
                    $saleKnownCogs += $itemCost;
                    $saleRecCogs   += $itemCost;
                    $saleRecItems++;
                } else {
                    $product = ($item->product && ($tenantId === null || (int) $item->product->tenant_id === (int) $tenantId))
                        ? $item->product
                        : null;

                    if ($product !== null && $product->cost_price !== null) {
                        $unitCost      = floatval($product->cost_price);
                        $itemCost      = $qty * $unitCost;
                        $saleKnownCogs += $itemCost;
                        $saleEstCogs   += $itemCost;
                        $saleEstItems++;
                    } else {
                        $saleUnavItems++;
                    }
                }
            }

            $rawDiscount       = max(0.0, floatval($sale->discount_amount ?? 0));
            $effectiveDiscount = min($saleGrossItems, $rawDiscount);
            $excessDiscount    = max(0.0, $rawDiscount - $effectiveDiscount);
            $saleNetRevenue    = max(0.0, $saleGrossItems - $effectiveDiscount);
            $saleTax           = max(0.0, floatval($sale->tax_amount ?? 0));
            $saleCollected     = max(0.0, $saleGrossItems - $rawDiscount + $saleTax);

            // Classify sale-level cost accuracy
            if ($saleUnavItems > 0 || $saleItemCount === 0) {
                $saleCostClass = 'unavailable';
                $totalUnavailableSales++;
            } elseif ($saleEstItems > 0) {
                $saleCostClass = 'estimated';
                $totalEstimatedSales++;
            } else {
                $saleCostClass = 'recorded';
                $totalRecordedSales++;
            }

            // Update overall totals
            $totalTransactions++;
            $totalGrossItemSales   += $saleGrossItems;
            $totalRawDiscounts     += $rawDiscount;
            $totalEffectiveDisc    += $effectiveDiscount;
            $totalExcessDisc       += $excessDiscount;
            $totalNetRevenue       += $saleNetRevenue;
            $totalTaxCollected     += $saleTax;
            $totalCollected        += $saleCollected;
            $totalKnownCogs        += $saleKnownCogs;
            $totalRecordedCogs     += $saleRecCogs;
            $totalEstimatedCogs    += $saleEstCogs;
            $totalItemsCount       += $saleItemCount;
            $totalRecordedItems    += $saleRecItems;
            $totalEstimatedItems   += $saleEstItems;
            $totalUnavailableItems += $saleUnavItems;

            // Update bucket accumulators
            if (isset($buckets[$bucketKey])) {
                $buckets[$bucketKey]['_gross_item_sales']  += $saleGrossItems;
                $buckets[$bucketKey]['_raw_discounts']     += $rawDiscount;
                $buckets[$bucketKey]['_effective_disc']    += $effectiveDiscount;
                $buckets[$bucketKey]['_excess_disc']       += $excessDiscount;
                $buckets[$bucketKey]['_net_revenue']       += $saleNetRevenue;
                $buckets[$bucketKey]['_tax_collected']     += $saleTax;
                $buckets[$bucketKey]['_total_collected']   += $saleCollected;
                $buckets[$bucketKey]['_known_cogs']        += $saleKnownCogs;
                $buckets[$bucketKey]['_recorded_cogs']     += $saleRecCogs;
                $buckets[$bucketKey]['_estimated_cogs']    += $saleEstCogs;
                $buckets[$bucketKey]['_transactions']      += 1;
                $buckets[$bucketKey]['_total_items']       += $saleItemCount;
                $buckets[$bucketKey]['_recorded_items']    += $saleRecItems;
                $buckets[$bucketKey]['_estimated_items']   += $saleEstItems;
                $buckets[$bucketKey]['_unavailable_items'] += $saleUnavItems;

                if ($saleCostClass === 'unavailable') {
                    $buckets[$bucketKey]['_unavailable_sales'] += 1;
                } elseif ($saleCostClass === 'estimated') {
                    $buckets[$bucketKey]['_estimated_sales'] += 1;
                } else {
                    $buckets[$bucketKey]['_recorded_sales'] += 1;
                }
            }
        }

        // Finalize buckets
        $series = [];
        foreach ($buckets as $bucket) {
            $bTransactions = $bucket['_transactions'];
            $bTotalItems   = $bucket['_total_items'];
            $bRecItems     = $bucket['_recorded_items'];
            $bEstItems     = $bucket['_estimated_items'];
            $bUnavItems    = $bucket['_unavailable_items'];
            $bRecSales     = $bucket['_recorded_sales'];
            $bEstSales     = $bucket['_estimated_sales'];
            $bUnavSales    = $bucket['_unavailable_sales'];

            $bGrossItems      = round($bucket['_gross_item_sales'], 2);
            $bDiscounts       = round($bucket['_raw_discounts'], 2);
            $bEffDiscounts    = round($bucket['_effective_disc'], 2);
            $bExcessDiscounts = round($bucket['_excess_disc'], 2);
            $bNetRevenue      = round($bucket['_net_revenue'], 2);
            $bTax             = round($bucket['_tax_collected'], 2);
            $bCollected       = round($bucket['_total_collected'], 2);
            $bKnownCogs       = round($bucket['_known_cogs'], 2);
            $bRecCogs         = round($bucket['_recorded_cogs'], 2);
            $bEstCogs         = round($bucket['_estimated_cogs'], 2);

            if ($bTransactions === 0) {
                $bCostStatus  = 'no_sales';
                $bCogs        = 0.0;
                $bGrossProfit = 0.0;
                $bGrossMargin = 0.0;
            } elseif ($bUnavItems > 0 || $bUnavSales > 0) {
                $bCostStatus  = 'unavailable';
                $bCogs        = null;
                $bGrossProfit = null;
                $bGrossMargin = null;
            } elseif ($bEstItems > 0) {
                $bCostStatus  = 'estimated';
                $bCogs        = $bKnownCogs;
                $bGrossProfit = round($bNetRevenue - $bKnownCogs, 2);
                $bGrossMargin = $bNetRevenue > 0
                    ? round((($bNetRevenue - $bKnownCogs) / $bNetRevenue) * 100, 2)
                    : 0.0;
            } else {
                $bCostStatus  = 'recorded';
                $bCogs        = $bKnownCogs;
                $bGrossProfit = round($bNetRevenue - $bKnownCogs, 2);
                $bGrossMargin = $bNetRevenue > 0
                    ? round((($bNetRevenue - $bKnownCogs) / $bNetRevenue) * 100, 2)
                    : 0.0;
            }

            $finalBucket = array_merge($bucket['meta'], [
                'gross_item_sales'    => $bGrossItems,
                'discounts'           => $bDiscounts,
                'total_discounts'     => $bDiscounts,
                'effective_discounts' => $bEffDiscounts,
                'excess_discounts'    => $bExcessDiscounts,
                'net_sales_revenue'   => $bNetRevenue,
                'net_revenue'         => $bNetRevenue,
                'revenue'             => $bNetRevenue,
                'tax_collected'       => $bTax,
                'total_collected'     => $bCollected,
                'cogs'                => $bCogs,
                'total_cogs'          => $bCogs,
                'known_cogs'          => $bKnownCogs,
                'gross_profit'        => $bGrossProfit,
                'gross_profit_margin' => $bGrossMargin,
                'margin'              => $bGrossMargin,
                'transaction_count'   => $bTransactions,
                'transactions'        => $bTransactions,
                'cost_status'         => $bCostStatus,
                'cost_accuracy'       => [
                    'status'                => $bCostStatus,
                    'is_complete'           => $bUnavItems === 0 && $bUnavSales === 0,
                    'is_estimated'          => ($bUnavItems === 0 && $bUnavSales === 0) && $bEstItems > 0,
                    'has_unavailable_costs' => $bUnavItems > 0 || $bUnavSales > 0,
                    'total_items'           => $bTotalItems,
                    'recorded_items'        => $bRecItems,
                    'estimated_items'       => $bEstItems,
                    'unavailable_items'     => $bUnavItems,
                    'recorded_sales'        => $bRecSales,
                    'estimated_sales'       => $bEstSales,
                    'unavailable_sales'     => $bUnavSales,
                    'recorded_cogs'         => $bRecCogs,
                    'estimated_cogs'        => $bEstCogs,
                    'known_cogs'            => $bKnownCogs,
                ],
            ]);

            $series[] = $finalBucket;
        }

        // Finalize summary
        $sGrossItems      = round($totalGrossItemSales, 2);
        $sDiscounts       = round($totalRawDiscounts, 2);
        $sEffDiscounts    = round($totalEffectiveDisc, 2);
        $sExcessDiscounts = round($totalExcessDisc, 2);
        $sNetRevenue      = round($totalNetRevenue, 2);
        $sTax             = round($totalTaxCollected, 2);
        $sCollected       = round($totalCollected, 2);
        $sKnownCogs       = round($totalKnownCogs, 2);
        $sRecCogs         = round($totalRecordedCogs, 2);
        $sEstCogs         = round($totalEstimatedCogs, 2);

        if ($totalTransactions === 0) {
            $overallCostStatus = 'no_sales';
            $sTotalCogs        = 0.0;
            $sGrossProfit      = 0.0;
            $sGrossMargin      = 0.0;
        } elseif ($totalUnavailableItems > 0 || $totalUnavailableSales > 0) {
            $overallCostStatus = 'unavailable';
            $sTotalCogs        = null;
            $sGrossProfit      = null;
            $sGrossMargin      = null;
        } elseif ($totalEstimatedItems > 0) {
            $overallCostStatus = 'estimated';
            $sTotalCogs        = $sKnownCogs;
            $sGrossProfit      = round($sNetRevenue - $sKnownCogs, 2);
            $sGrossMargin      = $sNetRevenue > 0
                ? round((($sNetRevenue - $sKnownCogs) / $sNetRevenue) * 100, 2)
                : 0.0;
        } else {
            $overallCostStatus = 'recorded';
            $sTotalCogs        = $sKnownCogs;
            $sGrossProfit      = round($sNetRevenue - $sKnownCogs, 2);
            $sGrossMargin      = $sNetRevenue > 0
                ? round((($sNetRevenue - $sKnownCogs) / $sNetRevenue) * 100, 2)
                : 0.0;
        }

        $costAccuracy = [
            'status'                => $overallCostStatus,
            'is_complete'           => $totalUnavailableItems === 0 && $totalUnavailableSales === 0,
            'is_estimated'          => ($totalUnavailableItems === 0 && $totalUnavailableSales === 0) && $totalEstimatedItems > 0,
            'has_unavailable_costs' => $totalUnavailableItems > 0 || $totalUnavailableSales > 0,
            'total_items'           => $totalItemsCount,
            'recorded_items'        => $totalRecordedItems,
            'estimated_items'       => $totalEstimatedItems,
            'unavailable_items'     => $totalUnavailableItems,
            'recorded_items_pct'    => $totalItemsCount > 0 ? round(($totalRecordedItems / $totalItemsCount) * 100, 1) : 0.0,
            'estimated_items_pct'   => $totalItemsCount > 0 ? round(($totalEstimatedItems / $totalItemsCount) * 100, 1) : 0.0,
            'unavailable_items_pct' => $totalItemsCount > 0 ? round(($totalUnavailableItems / $totalItemsCount) * 100, 1) : 0.0,
            'total_sales'           => $totalTransactions,
            'recorded_sales'        => $totalRecordedSales,
            'estimated_sales'       => $totalEstimatedSales,
            'unavailable_sales'     => $totalUnavailableSales,
            'recorded_cogs'         => $sRecCogs,
            'estimated_cogs'        => $sEstCogs,
            'known_cogs'            => $sKnownCogs,
        ];

        $summary = [
            'gross_item_sales'    => $sGrossItems,
            'total_discounts'     => $sDiscounts,
            'discounts'           => $sDiscounts,
            'effective_discounts' => $sEffDiscounts,
            'excess_discounts'    => $sExcessDiscounts,
            'net_sales_revenue'   => $sNetRevenue,
            'net_revenue'         => $sNetRevenue,
            'tax_collected'       => $sTax,
            'total_collected'     => $sCollected,
            'total_cogs'          => $sTotalCogs,
            'known_cogs'          => $sKnownCogs,
            'gross_profit'        => $sGrossProfit,
            'gross_profit_margin' => $sGrossMargin,
            'transaction_count'   => $totalTransactions,
            'total_transactions'  => $totalTransactions,
            'cost_status'         => $overallCostStatus,
            'cost_accuracy'       => $costAccuracy,
        ];

        return [
            'filters' => [
                'group_by'   => $groupBy,
                'start_date' => $rangeStart->toDateString(),
                'end_date'   => $rangeEnd->toDateString(),
                'year'       => $year,
            ],
            'gross_item_sales'    => $sGrossItems,
            'total_discounts'     => $sDiscounts,
            'discounts'           => $sDiscounts,
            'effective_discounts' => $sEffDiscounts,
            'excess_discounts'    => $sExcessDiscounts,
            'net_sales_revenue'   => $sNetRevenue,
            'net_revenue'         => $sNetRevenue,
            'tax_collected'       => $sTax,
            'total_collected'     => $sCollected,
            'total_cogs'          => $sTotalCogs,
            'known_cogs'          => $sKnownCogs,
            'gross_profit'        => $sGrossProfit,
            'gross_profit_margin' => $sGrossMargin,
            'transaction_count'   => $totalTransactions,
            'total_transactions'  => $totalTransactions,
            'cost_status'         => $overallCostStatus,
            'cost_accuracy'       => $costAccuracy,
            'summary'             => $summary,
            'series'              => $series,
            'buckets'             => $series,
        ];
    }

    private function createEmptyAnalyticsBucket(
        string $bucketKey,
        string $label,
        string $shortLabel,
        string $startDate,
        string $endDate,
        array $extra = []
    ): array {
        return [
            'meta' => array_merge([
                'bucket_key'  => $bucketKey,
                'label'       => $label,
                'short_label' => $shortLabel,
                'start_date'  => $startDate,
                'end_date'    => $endDate,
            ], $extra),
            '_gross_item_sales'  => 0.0,
            '_raw_discounts'     => 0.0,
            '_effective_disc'    => 0.0,
            '_excess_disc'       => 0.0,
            '_net_revenue'       => 0.0,
            '_tax_collected'     => 0.0,
            '_total_collected'   => 0.0,
            '_known_cogs'        => 0.0,
            '_recorded_cogs'     => 0.0,
            '_estimated_cogs'    => 0.0,
            '_transactions'      => 0,
            '_total_items'       => 0,
            '_recorded_items'    => 0,
            '_estimated_items'   => 0,
            '_unavailable_items' => 0,
            '_recorded_sales'    => 0,
            '_estimated_sales'   => 0,
            '_unavailable_sales' => 0,
        ];
    }
}
