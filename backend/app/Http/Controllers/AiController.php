<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Carbon\Carbon;

class AiController extends Controller
{
    /**
     * POST /api/ai/chat
     * Accepts { question: string } and returns an AI-generated answer
     * grounded in the tenant's actual business data.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate(['question' => 'required|string|max:1000']);

        $apiKey = config('services.mistral.key');
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'AI service is not configured. Please set MISTRAL_API_KEY in your .env file.',
            ], 503);
        }

        $context = $this->buildContext();

        $systemPrompt = <<<PROMPT
You are a smart financial and business analyst assistant embedded in an inventory and sales management system.
You help small business owners understand their financial performance, spot trends, and make better decisions.

Always:
- Be concise but thorough. Use bullet points for lists.
- Format currency as UGX with comma separators (e.g. UGX 1,200,000).
- When asked to forecast, use the historical data provided and state your assumptions clearly.
- If the data is insufficient for a reliable forecast, say so honestly and suggest what data would help.
- Keep a friendly, professional tone — like a trusted business advisor.

Here is the current business data snapshot:

{$context}
PROMPT;

        $candidateModels = array_values(array_unique(array_filter([
            env('MISTRAL_MODEL', 'open-mistral-7b'),
            'open-mistral-7b',
            'open-mistral-nemo',
            'mistral-tiny',
            'mistral-small-latest',
        ])));

        $lastError  = null;
        $lastStatus = 500;

        foreach ($candidateModels as $model) {
            $payload = [
                'model'       => $model,
                'messages'    => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user',   'content' => $request->question],
                ],
                'temperature' => 0.4,
                'max_tokens'  => 1024,
            ];

            try {
                $response = $this->mistralClient()
                    ->withHeaders([
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type'  => 'application/json',
                    ])
                    ->post('https://api.mistral.ai/v1/chat/completions', $payload);
            } catch (\Throwable $e) {
                $lastError  = $this->connectionErrorMessage($e);
                $lastStatus = 502;
                continue;
            }

            if ($response->successful()) {
                $text = $response->json('choices.0.message.content') ?? 'No response generated.';
                return response()->json(['success' => true, 'answer' => $text]);
            }

            $lastStatus = $response->status();
            $lastError  = $response->json('message') ?? $response->json('error.message') ?? 'Unknown error';

            // If rate-limited (429) or model not supported (404), try the next candidate model
            if ($lastStatus === 429 || $lastStatus === 404) {
                continue;
            }

            // If another fatal error (e.g. 401 unauthenticated), stop and return
            break;
        }

        if ($lastStatus === 429) {
            return response()->json([
                'success' => false,
                'message' => 'The AI service is temporarily rate-limited. Please wait a moment and try again.',
            ], 429);
        }

        return response()->json([
            'success' => false,
            'message' => "AI service error: {$lastError}",
        ], $lastStatus >= 400 && $lastStatus < 600 ? $lastStatus : 502);
    }

    /**
     * Build a rich text context snapshot from the tenant's live data.
     */
    private function buildContext(): string
    {
        $tenantId = Auth::user()->tenant_id;
        $now      = Carbon::now();

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
     * @param int|string $tenantId
     * @return array<string, float|int>
     */
    private function buildSalesSummary($tenantId, Carbon $now): array
    {
        $allSales = Sale::where('tenant_id', $tenantId)->get();

        $salesToday    = $allSales->filter(fn($s) => Carbon::parse($s->sale_date)->isToday());
        $salesThisWeek = $allSales->filter(fn($s) => Carbon::parse($s->sale_date)->isCurrentWeek());
        $salesThisMon  = $allSales->filter(fn($s) => Carbon::parse($s->sale_date)->isCurrentMonth());
        $salesLastMon  = $allSales->filter(fn($s) => Carbon::parse($s->sale_date)->month === $now->copy()->subMonth()->month
            && Carbon::parse($s->sale_date)->year  === $now->copy()->subMonth()->year);

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
     * @param int|string $tenantId
     * @return array<int, string>
     */
    private function buildMonthlyTrend($tenantId, Carbon $now): array
    {
        $allSales = Sale::where('tenant_id', $tenantId)->get();
        $monthlyTrend = [];

        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $label = $month->format('M Y');
            $total = (float) $allSales
                ->filter(fn($s) => Carbon::parse($s->sale_date)->month === (int)$month->month
                    && Carbon::parse($s->sale_date)->year  === (int)$month->year)
                ->sum('total_amount');
            $monthlyTrend[] = "{$label}: UGX " . number_format($total, 0);
        }

        return $monthlyTrend;
    }

    /**
     * @param int|string $tenantId
     * @return array<string, float|int>
     */
    private function buildPurchasesSummary($tenantId): array
    {
        $allPurchases = Purchase::where('tenant_id', $tenantId)->get();
        $purchThisMon = $allPurchases->filter(fn($p) => Carbon::parse($p->purchase_date ?? $p->created_at)->isCurrentMonth());

        return [
            'this_month_total' => (float) $purchThisMon->sum('total_amount'),
            'this_month_count' => $purchThisMon->count(),
        ];
    }

    /**
     * @param int|string $tenantId
     * @return array<string, mixed>
     */
    private function buildInventorySummary($tenantId): array
    {
        $products   = Product::where('tenant_id', $tenantId)->get();
        $lowStock   = $products->filter(fn($p) => $p->stock <= $p->reorder_level && $p->stock > 0);
        $outOfStock = $products->filter(fn($p) => $p->stock <= 0);

        return [
            'total_count'        => $products->count(),
            'low_stock_count'    => $lowStock->count(),
            'low_stock_str'      => $lowStock->map(fn($p) => "  - {$p->name}: {$p->stock} left (reorder at {$p->reorder_level})")->implode("\n") ?: '  None',
            'out_of_stock_count' => $outOfStock->count(),
            'out_of_stock_str'   => $outOfStock->map(fn($p) => "  - {$p->name}")->implode("\n") ?: '  None',
        ];
    }

    /**
     * @param int|string $tenantId
     */
    private function buildTopProductsSummary($tenantId): string
    {
        $productRevenue = SaleItem::whereHas('sale', fn($q) => $q->where('tenant_id', $tenantId))
            ->with('product:id,name')
            ->get()
            ->groupBy('product_id')
            ->map(fn($items) => [
                'name'    => $items->first()->product->name ?? "Product #{$items->first()->product_id}",
                'revenue' => (float) $items->sum('subtotal'),
                'qty'     => (int) $items->sum('quantity'),
            ])
            ->sortByDesc('revenue')
            ->take(5);

        return $productRevenue->map(fn($p) => "  - {$p['name']}: UGX " . number_format($p['revenue'], 0) . " ({$p['qty']} units)")->implode("\n");
    }

    private function fmt(float $amount): string
    {
        return number_format($amount, 0);
    }

    /**
     * HTTP client for Mistral API with SSL CA bundle support on Windows/local dev.
     */
    private function mistralClient()
    {
        $client = Http::timeout(30);

        $caBundle = $this->resolveCaBundle();
        if ($caBundle) {
            $client = $client->withOptions(['verify' => $caBundle]);
        }

        return $client;
    }

    private function resolveCaBundle(): ?string
    {
        $candidates = array_filter([
            config('services.mistral.ca_bundle'),
            ini_get('curl.cainfo') ?: null,
            ini_get('openssl.cafile') ?: null,
            'C:\\xampp\\apache\\bin\\curl-ca-bundle.crt',
            'C:\\xampp\\php\\extras\\ssl\\cacert.pem',
        ]);

        foreach ($candidates as $path) {
            $path = trim((string) $path);
            if ($path !== '' && is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    private function connectionErrorMessage(\Throwable $e): string
    {
        $detail = $e->getMessage();

        if (str_contains($detail, 'SSL certificate') || str_contains($detail, 'cURL error 60')) {
            return 'SSL certificate verification failed. Add CURL_CA_BUNDLE=C:\\xampp\\apache\\bin\\curl-ca-bundle.crt to backend/.env, then restart the backend using XAMPP PHP: C:\\xampp\\php\\php.exe artisan serve';
        }

        if ($e instanceof ConnectionException) {
            return 'Could not connect to the AI service. Please check your internet connection and try again.';
        }

        return 'Could not reach the AI service. Please try again in a moment.';
    }
}
