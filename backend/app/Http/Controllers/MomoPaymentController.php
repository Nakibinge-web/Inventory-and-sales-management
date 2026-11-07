<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Models\MomoTransaction;
use App\Models\Tenant;
use App\Models\User;
use App\Services\MomoService;
use Exception;

class MomoPaymentController extends Controller
{
    protected MomoService $momoService;

    public function __construct(MomoService $momoService)
    {
        $this->momoService = $momoService;
    }

    /**
     * Plan specifications and pricing
     */
    protected array $planCatalog = [
        'starter' => [
            'id'           => 'starter',
            'name'         => 'Starter',
            'tagline'      => 'For single-store retailers and boutique shops getting organized.',
            'monthlyPrice' => 10000,
            'annualPrice'  => 100000,
            'currency'     => 'UGX',
            'features'     => [
                'Up to 500 catalog items',
                '1 active POS checkout terminal',
                '2 staff accounts (Owner & Cashier)',
                'Automated SKU generation',
                'Real-time stock deduction on sale',
                'Low-stock threshold alerts',
                'Thermal receipt printing',
                'Standard business support',
            ],
        ],
        'business' => [
            'id'           => 'business',
            'name'         => 'Business',
            'tagline'      => 'For growing retail stores, supermarkets, and wholesale businesses.',
            'monthlyPrice' => 180000,
            'annualPrice'  => 1500000, // UGX 150,000/mo billed annually
            'currency'     => 'UGX',
            'features'     => [
                'Unlimited catalog items & categories',
                'Unlimited POS sales transactions',
                'Up to 10 staff accounts with custom roles',
                'Granular permissions (sales, inventory, audit)',
                'Supplier purchase orders & vendor dues',
                'Proforma and formal tax invoices',
                'Daily, weekly & monthly financial reports',
                'Built-in AI business assistant queries',
                'Priority email and phone support',
            ],
        ],
    ];

    /**
     * Return available plans and pricing.
     */
    public function plans()
    {
        return response()->json([
            'success' => true,
            'plans'   => array_values($this->planCatalog),
        ]);
    }

    /**
     * Diagnostic endpoint to check configuration status.
     */
    public function configCheck()
    {
        $summary = $this->momoService->getConfigSummary();

        return response()->json([
            'success'       => true,
            'configuration' => $summary,
            'message'       => $summary['is_configured']
                ? 'MTN MoMo Sandbox credentials are configured and ready.'
                : 'MTN MoMo credentials missing in .env (MOMO_API_USER_ID, MOMO_API_KEY, MOMO_COLLECTION_SUBSCRIPTION_KEY).',
        ]);
    }

    /**
     * Initiate a Request to Pay (Collection) transaction.
     */
    public function initiate(Request $request)
    {
        $request->validate([
            'phone'          => 'required|string|min:9|max:20',
            'plan_id'        => 'required|string|in:starter,business',
            'billing_cycle'  => 'required|string|in:monthly,annual',
            'customer_name'  => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'business_name'  => 'nullable|string|max:255',
        ]);

        $planKey = $request->plan_id;
        $plan = $this->planCatalog[$planKey] ?? null;

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid subscription plan selected.',
            ], 422);
        }

        $cycle = $request->billing_cycle;
        $amountUgx = ($cycle === 'annual') ? $plan['annualPrice'] : $plan['monthlyPrice'];

        // Determine currency and amount to pass to MTN API
        // In MTN MoMo Sandbox, the API ONLY accepts EUR as currency.
        $momoEnv = config('momo.environment', 'sandbox');
        $momoCurrency = config('momo.currency', ($momoEnv === 'sandbox' ? 'EUR' : 'UGX'));

        // In sandbox with EUR, normalize amount to a standard sandbox test amount (e.g., 10.00 EUR)
        $momoAmount = ($momoCurrency === 'EUR') ? 10.00 : $amountUgx;

        // Generate unique UUID v4 for MTN X-Reference-Id
        $referenceId = (string) Str::uuid();
        $externalId = 'ORD-' . strtoupper(Str::random(8));

        // Locate current user or tenant if authenticated via Sanctum
        $user = auth('sanctum')->user();
        $tenantId = $user?->tenant_id;

        // If not authenticated, see if tenant exists by email
        if (!$tenantId) {
            $existingTenant = Tenant::where('email', $request->customer_email)->first();
            $tenantId = $existingTenant?->id;
        }

        // Store transaction record as PENDING
        $transaction = MomoTransaction::create([
            'reference_id'   => $referenceId,
            'external_id'    => $externalId,
            'tenant_id'      => $tenantId,
            'user_id'        => $user?->id,
            'customer_name'  => $request->customer_name,
            'customer_email' => $request->customer_email,
            'customer_phone' => $this->momoService->formatMsisdn($request->phone),
            'plan_id'        => $plan['id'],
            'plan_name'      => $plan['name'],
            'billing_cycle'  => $cycle,
            'amount'         => $amountUgx,
            'currency'       => 'UGX',
            'momo_amount'    => $momoAmount,
            'momo_currency'  => $momoCurrency,
            'status'         => 'PENDING',
            'payer_message'  => "StockPro {$plan['name']} Plan",
            'payee_note'     => "Subscription for {$request->customer_name}",
        ]);

        try {
            $this->momoService->requestToPay(
                $referenceId,
                $momoAmount,
                $momoCurrency,
                $request->phone,
                $externalId,
                "StockPro {$plan['name']} Plan",
                "Subscription {$externalId}"
            );


            return response()->json([
                'success'        => true,
                'message'        => 'Payment authorization prompt sent to your MTN phone. Please check your screen and enter your PIN.',
                'reference_id'   => $referenceId,
                'external_id'    => $externalId,
                'status'         => 'PENDING',
                'amount'         => $amountUgx,
                'currency'       => 'UGX',
                'customer_phone' => $transaction->customer_phone,
                'plan_name'      => $plan['name'],
                'poll_interval'  => 3000, // milliseconds
            ], 200);

        } catch (Exception $e) {
            Log::error('MTN MoMo Initiate Error: ' . $e->getMessage(), [
                'reference_id' => $referenceId,
            ]);

            $transaction->update([
                'status'         => 'FAILED',
                'failure_reason' => $e->getMessage(),
            ]);

            return response()->json([
                'success'      => false,
                'message'      => 'Failed to initiate MTN MoMo transaction: ' . $e->getMessage(),
                'reference_id' => $referenceId,
                'status'       => 'FAILED',
            ], 400);
        }
    }

    /**
     * Check transaction status by Reference ID.
     */
    public function status(string $referenceId)
    {
        $transaction = MomoTransaction::where('reference_id', $referenceId)->first();

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction reference not found.',
            ], 404);
        }

        // If already resolved, return stored result
        if (!$transaction->isPending()) {
            return response()->json([
                'success'     => true,
                'status'      => $transaction->status,
                'transaction' => $transaction,
            ]);
        }

        // Query status from MTN MoMo Gateway API
        try {
            $momoData = $this->momoService->getTransactionStatus($referenceId);
            $newStatus = strtoupper($momoData['status'] ?? 'PENDING');

            if ($newStatus === 'SUCCESSFUL') {
                $transaction->update([
                    'status'                   => 'SUCCESSFUL',
                    'financial_transaction_id' => $momoData['financialTransactionId'] ?? null,
                    'raw_response'             => $momoData,
                ]);

                // Update or provision Tenant Subscription
                $this->handleSuccessfulSubscription($transaction);

            } elseif (in_array($newStatus, ['FAILED', 'REJECTED', 'TIMEOUT'])) {
                $transaction->update([
                    'status'         => $newStatus,
                    'failure_reason' => $momoData['reason'] ?? 'Payment was cancelled or rejected by user.',
                    'raw_response'   => $momoData,
                ]);
            }

            return response()->json([
                'success'     => true,
                'status'      => $transaction->status,
                'transaction' => $transaction->fresh(),
            ]);

        } catch (Exception $e) {
            Log::warning('Error querying MTN MoMo status: ' . $e->getMessage());

            return response()->json([
                'success'     => true,
                'status'      => $transaction->status,
                'transaction' => $transaction,
                'poll_error'  => $e->getMessage(),
            ]);
        }
    }

    /**
     * Webhook endpoint called asynchronously by MTN MoMo.
     */
    public function webhook(Request $request)
    {
        Log::info('MTN MoMo Webhook Received', [
            'headers' => $request->headers->all(),
            'payload' => $request->all(),
        ]);

        $payload = $request->all();
        $referenceId = $request->header('X-Reference-Id') 
            ?? $payload['referenceId'] 
            ?? $payload['externalId'] 
            ?? null;

        if (!$referenceId) {
            return response()->json(['message' => 'Missing reference identifier'], 400);
        }

        $transaction = MomoTransaction::where('reference_id', $referenceId)
            ->orWhere('external_id', $referenceId)
            ->first();

        if (!$transaction) {
            Log::warning("MTN MoMo Webhook: Transaction not found for {$referenceId}");
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        $incomingStatus = strtoupper($payload['status'] ?? '');

        if ($incomingStatus === 'SUCCESSFUL') {
            $transaction->update([
                'status'                   => 'SUCCESSFUL',
                'financial_transaction_id' => $payload['financialTransactionId'] ?? null,
                'webhook_payload'          => $payload,
            ]);

            $this->handleSuccessfulSubscription($transaction);

        } elseif (in_array($incomingStatus, ['FAILED', 'REJECTED'])) {
            $transaction->update([
                'status'          => $incomingStatus,
                'failure_reason'  => $payload['reason'] ?? 'Payment failed on network.',
                'webhook_payload' => $payload,
            ]);
        }

        return response()->json(['success' => true, 'message' => 'Webhook processed successfully.']);
    }

    /**
     * Update tenant subscription details upon successful payment.
     */
    protected function handleSuccessfulSubscription(MomoTransaction $transaction): void
    {
        $tenant = null;

        if ($transaction->tenant_id) {
            $tenant = Tenant::find($transaction->tenant_id);
        } elseif (!empty($transaction->customer_email)) {
            $tenant = Tenant::where('email', $transaction->customer_email)->first();
        }

        if ($tenant) {
            $durationMonths = ($transaction->billing_cycle === 'annual') ? 12 : 1;
            $expiresAt = now()->addMonths($durationMonths);

            $tenant->update([
                'subscription_plan'       => $transaction->plan_id,
                'subscription_status'     => 'active',
                'subscription_expires_at' => $expiresAt,
            ]);

            Log::info("Activated {$transaction->plan_id} subscription for Tenant #{$tenant->id} until {$expiresAt}");
        }
    }
}
