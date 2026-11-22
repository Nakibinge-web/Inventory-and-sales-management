<?php

namespace App\Services\Ai;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;

class BusinessContextBuilder
{
    public function __construct(private PromptSecurityService $security)
    {
    }

    /**
     * Build a sanitized text snapshot from the tenant's live business data.
     */
    public function buildForTenant(int|string $tenantId): string
    {
        $now = Carbon::now();

        $salesSummary     = $this->buildSalesSummary($tenantId, $now);
        $purchasesSummary = $this->buildPurchasesSummary($tenantId);
        $inventorySummary = $this->buildInventorySummary($tenantId);
        $topProductsStr   = $this->buildTopProductsSummary($tenantId);
        $monthlyTrendStr  = implode(', ', $this->buildMonthlyTrend($tenantId, $now));

        $grossProfit = $salesSummary['this_month_total'] - $purchasesSummary['this_month_total'];

        return <<<CONTEXT
DATE: {$now->toDateString()}

SALES SUMMARY:
- Today: UGX {$this->fmt($salesSummary['today_total'])} ({$salesSummary['today_count']} transactions)
- This week: UGX {$this->fmt($salesSummary['this_week_total'])} ({$salesSummary['this_week_count']} transactions)
- This month: UGX {$this->fmt($salesSummary['this_month_total'])} ({$salesSummary['this_month_count']} transactions)
- Last month: UGX {$this->fmt($salesSummary['last_month_total'])} ({$salesSummary['last_month_count']} transactions)
- All-time total sales: UGX {$this->fmt($salesSummary['all_time_total'])} ({$salesSummary['all_time_count']} transactions)

MONTHLY REVENUE TREND (last 6 months):
{$monthlyTrendStr}

PURCHASES (this month): UGX {$this->fmt($purchasesSummary['this_month_total'])} ({$purchasesSummary['this_month_count']} purchase orders)
ESTIMATED GROSS PROFIT (this month): UGX {$this->fmt($grossProfit)}

INVENTORY:
- Total products: {$inventorySummary['total_count']}
- Low stock items ({$inventorySummary['low_stock_count']}):
{$inventorySummary['low_stock_str']}
- Out of stock ({$inventorySummary['out_of_stock_count']}):
{$inventorySummary['out_of_stock_str']}

TOP 5 PRODUCTS BY ALL-TIME REVENUE:
{$topProductsStr}
CONTEXT;
    }

    /**
     * @return array<string, float|int>
     */
    private function buildSalesSummary(int|string $tenantId, Carbon $now): array
    {
        $allSales = Sale::where('tenant_id', $tenantId)->get();

        $salesToday    = $allSales->filter(fn($s) => Carbon::parse($s->sale_date)->isToday());
        $salesThisWeek = $allSales->filter(fn($s) => Carbon::parse($s->sale_date)->isCurrentWeek());
        $salesThisMon  = $allSales->filter(fn($s) => Carbon::parse($s->sale_date)->isCurrentMonth());
        $salesLastMon  = $allSales->filter(
            fn($s) => Carbon::parse($s->sale_date)->month === $now->copy()->subMonth()->month
                && Carbon::parse($s->sale_date)->year === $now->copy()->subMonth()->year
        );

        return [
            'today_total'      => (float) $salesToday->sum('total_amount'),
            'today_count'      => $salesToday->count(),
            'this_week_total'  => (float) $salesThisWeek->sum('total_amount'),
            'this_week_count'  => $salesThisWeek->count(),
            'this_month_total' => (float) $salesThisMon->sum('total_amount'),
            'this_month_count' => $salesThisMon->count(),
            'last_month_total' => (float) $salesLastMon->sum('total_amount'),
            'last_month_count' => $salesLastMon->count(),
            'all_time_total'   => (float) $allSales->sum('total_amount'),
            'all_time_count'   => $allSales->count(),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function buildMonthlyTrend(int|string $tenantId, Carbon $now): array
    {
        $allSales = Sale::where('tenant_id', $tenantId)->get();
        $monthlyTrend = [];

        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $label = $month->format('M Y');
            $total = (float) $allSales
                ->filter(
                    fn($s) => Carbon::parse($s->sale_date)->month === (int) $month->month
                        && Carbon::parse($s->sale_date)->year === (int) $month->year
                )
                ->sum('total_amount');
            $monthlyTrend[] = "{$label}: UGX " . number_format($total, 0);
        }

        return $monthlyTrend;
    }

    /**
     * @return array<string, float|int>
     */
    private function buildPurchasesSummary(int|string $tenantId): array
    {
        $allPurchases = Purchase::where('tenant_id', $tenantId)->get();
        $purchThisMon = $allPurchases->filter(fn($p) => Carbon::parse($p->purchase_date ?? $p->created_at)->isCurrentMonth());

        return [
            'this_month_total' => (float) $purchThisMon->sum('total_amount'),
            'this_month_count' => $purchThisMon->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildInventorySummary(int|string $tenantId): array
    {
        $products   = Product::where('tenant_id', $tenantId)->get();
        $lowStock   = $products->filter(fn($p) => $p->stock <= $p->reorder_level && $p->stock > 0);
        $outOfStock = $products->filter(fn($p) => $p->stock <= 0);

        return [
            'total_count'        => $products->count(),
            'low_stock_count'    => $lowStock->count(),
            'low_stock_str'      => $lowStock->map(
                fn($p) => '  - ' . $this->security->sanitizeUntrustedData((string) $p->name) . ": {$p->stock} left (reorder at {$p->reorder_level})"
            )->implode("\n") ?: '  None',
            'out_of_stock_count' => $outOfStock->count(),
            'out_of_stock_str'   => $outOfStock->map(
                fn($p) => '  - ' . $this->security->sanitizeUntrustedData((string) $p->name)
            )->implode("\n") ?: '  None',
        ];
    }

    private function buildTopProductsSummary(int|string $tenantId): string
    {
        $productRevenue = SaleItem::whereHas('sale', fn($q) => $q->where('tenant_id', $tenantId))
            ->with('product:id,name')
            ->get()
            ->groupBy('product_id')
            ->map(function ($items) {
                $rawName = $items->first()->product->name ?? "Product #{$items->first()->product_id}";
                return [
                    'name'    => $this->security->sanitizeUntrustedData((string) $rawName),
                    'revenue' => (float) $items->sum('subtotal'),
                    'qty'     => (int) $items->sum('quantity'),
                ];
            })
            ->sortByDesc('revenue')
            ->take(5);

        return $productRevenue->map(
            fn($p) => "  - {$p['name']}: UGX " . number_format($p['revenue'], 0) . " ({$p['qty']} units)"
        )->implode("\n") ?: '  None';
    }

    private function fmt(float $amount): string
    {
        return number_format($amount, 0);
    }
}
