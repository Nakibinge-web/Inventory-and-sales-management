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
     */
    public function calcProfitForSales(Collection $sales): array
    {
        $totalCost = 0;

        $salesWithProfit = $sales->map(function ($sale) use (&$totalCost) {
            $saleCost = $sale->saleItems->sum(function ($item) {
                $costPrice = $item->product?->cost_price ?? 0;
                return $item->quantity * floatval($costPrice);
            });
            $totalCost   += $saleCost;
            $saleProfit   = floatval($sale->total_amount) - $saleCost;
            // Append computed fields
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

    public function getDailySalesReport(string $date): array
    {
        $sales = Sale::whereDate('sale_date', $date)
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        return [
            'date'               => $date,
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'total_profit'       => $totalProfit,
            'total_transactions' => $sales->count(),
            'sales'              => $sales,
        ];
    }

    public function getWeeklySalesReport(string $date): array
    {
        $dateObj   = Carbon::parse($date);
        $weekStart = $dateObj->copy()->startOfWeek(Carbon::MONDAY);
        $weekEnd   = $dateObj->copy()->endOfWeek(Carbon::SUNDAY);

        $sales = Sale::whereBetween('sale_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date')
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        $byDay = [];
        for ($d = $weekStart->copy(); $d->lte($weekEnd); $d->addDay()) {
            $dayStr   = $d->toDateString();
            $daySales = $sales->filter(fn($s) => Carbon::parse($s->sale_date)->toDateString() === $dayStr);
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

        return [
            'week_start'         => $weekStart->toDateString(),
            'week_end'           => $weekEnd->toDateString(),
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'total_profit'       => $totalProfit,
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
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date')
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        $daysInMonth = Carbon::createFromDate($year, $monthNum, 1)->daysInMonth;
        $byDay = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $dayStr   = sprintf('%04d-%02d-%02d', $year, $monthNum, $d);
            $daySales = $sales->filter(fn($s) => Carbon::parse($s->sale_date)->toDateString() === $dayStr);
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

        $byPayment = $sales->groupBy('payment_method')->map(fn($g) => [
            'method' => $g->first()->payment_method,
            'total'  => $g->sum('total_amount'),
            'profit' => round($g->sum('profit'), 2),
            'count'  => $g->count(),
        ])->values();

        return [
            'month'              => $month,
            'total_sales'        => $sales->sum('total_amount'),
            'total_cost'         => $totalCost,
            'total_profit'       => $totalProfit,
            'total_transactions' => $sales->count(),
            'by_day'             => $byDay,
            'by_payment'         => $byPayment,
            'sales'              => $sales,
        ];
    }

    public function getYearlySalesReport(int $year): array
    {
        $sales = Sale::whereYear('sale_date', $year)
                     ->with(['user', 'customer', 'saleItems.product'])
                     ->orderBy('sale_date')
                     ->get();

        ['total_cost' => $totalCost, 'total_profit' => $totalProfit, 'sales' => $sales] =
            $this->calcProfitForSales($sales);

        $byMonth = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthSales = $sales->filter(fn($s) => (int) Carbon::parse($s->sale_date)->month === $m);
            $monthCost = $monthSales->sum('cost');
            $byMonth[] = [
                'month'        => $m,
                'month_name'   => Carbon::createFromDate($year, $m, 1)->format('M'),
                'total'        => round($monthSales->sum('total_amount'), 2),
                'cost'         => round($monthCost, 2),
                'profit'       => round($monthSales->sum('total_amount') - $monthCost, 2),
                'transactions' => $monthSales->count(),
            ];
        }

        $byQuarter = [];
        foreach ([[1,3,'Q1'],[4,6,'Q2'],[7,9,'Q3'],[10,12,'Q4']] as [$from, $to, $label]) {
            $qSales = $sales->filter(fn($s) => (int) Carbon::parse($s->sale_date)->month >= $from && (int) Carbon::parse($s->sale_date)->month <= $to);
            $qCost = $qSales->sum('cost');
            $byQuarter[] = [
                'quarter'      => $label,
                'total'        => round($qSales->sum('total_amount'), 2),
                'cost'         => round($qCost, 2),
                'profit'       => round($qSales->sum('total_amount') - $qCost, 2),
                'transactions' => $qSales->count(),
            ];
        }

        $byPayment = $sales->groupBy('payment_method')->map(fn($g) => [
            'method' => $g->first()->payment_method,
            'total'  => $g->sum('total_amount'),
            'profit' => round($g->sum('profit'), 2),
            'count'  => $g->count(),
        ])->values();

        $bestMonth  = collect($byMonth)->sortByDesc('total')->first();
        $worstMonth = collect($byMonth)->where('transactions', '>', 0)->sortBy('total')->first();

        return [
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
}
