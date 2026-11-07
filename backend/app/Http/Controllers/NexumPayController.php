<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\NexumPayTransaction;
use App\Models\Tenant;
use App\Services\NexumPayService;
use Exception;

class NexumPayController extends Controller
{
    protected NexumPayService $nexumPay;

    public function __construct(NexumPayService $nexumPay)
    {
        $this->nexumPay = $nexumPay;
    }

    /**
     * Subscription Plans Catalog (UGX)
     */
    protected array $planCatalog = [
        'starter' => [
            'id'                => 'starter',
            'name'              => 'Starter Plan',
            'badge'             => 'Solo Retailers',
            'tagline'           => 'For boutique shops, electronics counters, and solo store owners.',
            'monthlyPrice'      => 1000,
            'annualMonthlyRate' => 1000,
            'annualPrice'       => 1000,
            'currency'          => 'UGX',
            'features'          => [
                'Up to 1,000 catalog items',
                '2 active POS registers',
                '3 staff accounts with roles',
                'Low-stock threshold alerts',
                'Customer accounts & receipts',
                'Automated SKU generation',
                'Daily sales & profit summaries',
                'Email & WhatsApp support',
            ],
        ],
        'business' => [
            'id'                => 'business',
            'name'              => 'Business Plan',
            'badge'             => 'Most Popular',
            'tagline'           => 'For supermarkets, high-traffic retailers, and wholesale depots.',
            'monthlyPrice'      => 2000,
            'annualMonthlyRate' => 2000,
            'annualPrice'       => 2000,
            'currency'          => 'UGX',
            'features'          => [
                'Unlimited catalog items & categories',
                'Unlimited POS sales transactions',
                'Up to 10 staff accounts & shifts',
                'Granular cashier permissions',
                'Supplier purchase orders & dues',
                'Customer credit ledgers & tax bills',
                'Built-in AI inventory assistant',
                'Priority phone & on-site support',
            ],
        ],
    ];

    /**
     * GET /api/nexumpay/plans
     */
    public function plans()
    {
        return response()->json([
            'success' => true,
            'plans'   => array_values($this->planCatalog),
        ]);
    }

    /**
     * GET /api/nexumpay/config-check
     */
    public function configCheck()
    {
        $summary = $this->nexumPay->getConfigSummary();

        return response()->json([
            'success'       => true,
            'configuration' => $summary,
            'message'       => $summary['is_configured']
                ? 'NexumPay Live API credentials are configured and active.'
                : 'Running in NexumPay Simulation Mode (Add NEXUMPAY_WALLET_ADDRESS and NEXUMPAY_AUTH_TOKEN in backend/.env for live collections).',
        ]);
    }

    /**
     * POST /api/nexumpay/initiate
     * Initiates a NexumPay Mobile Money Collection request.
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

        $planKey = strtolower($request->plan_id);
        $plan    = $this->planCatalog[$planKey] ?? null;

        if (!$plan) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid subscription plan selected.',
            ], 422);
        }

        $cycle     = strtolower($request->billing_cycle);
        $amountUgx = ($cycle === 'annual') ? $plan['annualPrice'] : $plan['monthlyPrice'];

        // Unique identifiers
        $referenceId = (string) Str::uuid();
        // NexumPay client_ref / reference
        $clientRef   = 'NXP' . now()->format('ymdHis') . rand(100, 999);

        $localPhone  = $this->nexumPay->formatLocalPhone($request->phone);
        $msisdn      = $this->nexumPay->formatMsisdn($request->phone);
        $network     = $this->nexumPay->detectNetwork($request->phone);

        // Identify current authenticated user/tenant if present
        $user     = auth('sanctum')->user();
        $tenantId = $user?->tenant_id;

        if (!$tenantId) {
            try {
                $existingTenant = Tenant::where('email', $request->customer_email)->first();
                $tenantId = $existingTenant?->id;
            } catch (Exception $e) {
                // Ignore if DB not migrated yet
            }
        }

        $narration = "StockPro {$plan['name']} (" . ucfirst($cycle) . ")";

        // Persist transaction record in nexumpay_transactions table
        $transaction = null;
        try {
            $transaction = NexumPayTransaction::create([
                'reference_id'   => $referenceId,
                'client_ref'     => $clientRef,
                'tenant_id'      => $tenantId,
                'user_id'        => $user?->id,
                'customer_name'  => $request->customer_name,
                'customer_email' => $request->customer_email,
                'business_name'  => $request->business_name ?: $request->customer_name,
                'phone_number'   => $localPhone,
                'msisdn'         => $msisdn,
                'network'        => $network,
                'plan_id'        => $plan['id'],
                'plan_name'      => $plan['name'],
                'billing_cycle'  => $cycle,
                'amount'         => $amountUgx,
                'charge'         => 0.00,
                'currency'       => 'UGX',
                'status'         => 'PENDING',
                'narration'      => $narration,
            ]);
        } catch (Exception $dbEx) {
            Log::warning('NexumPay: Could not insert into nexumpay_transactions table, using cache fallback: ' . $dbEx->getMessage());
        }

        $cachedRecord = [
            'reference_id'             => $referenceId,
            'external_id'              => $clientRef,
            'client_ref'               => $clientRef,
            'tenant_id'                => $tenantId,
            'user_id'                  => $user?->id,
            'customer_name'            => $request->customer_name,
            'customer_email'           => $request->customer_email,
            'business_name'            => $request->business_name ?: $request->customer_name,
            'customer_phone'           => $localPhone,
            'msisdn'                   => $msisdn,
            'network'                  => $network,
            'plan_id'                  => $plan['id'],
            'plan_name'                => $plan['name'],
            'billing_cycle'            => $cycle,
            'amount'                   => $amountUgx,
            'currency'                 => 'UGX',
            'status'                   => 'PENDING',
            'financial_transaction_id' => null,
            'charge'                   => '0.00',
            'created_at'               => now()->toDateTimeString(),
        ];

        $this->saveCachedTransaction($referenceId, $clientRef, $cachedRecord);

        try {
            $gatewayResult = $this->nexumPay->requestPayment(
                $localPhone,
                $amountUgx,
                $narration,
                $clientRef
            );

            return response()->json([
                'success'        => true,
                'gateway'        => 'NexumPay',
                'mode'           => $gatewayResult['mode'] ?? 'live',
                'message'        => $gatewayResult['message'] ?? "Payment prompt sent to {$localPhone}. Enter your Mobile Money PIN to complete payment.",
                'reference_id'   => $referenceId,
                'client_ref'     => $clientRef,
                'status'         => 'PENDING',
                'amount'         => $amountUgx,
                'currency'       => 'UGX',
                'customer_phone' => $localPhone,
                'msisdn'         => $msisdn,
                'network'        => $network,
                'plan_id'        => $plan['id'],
                'plan_name'      => $plan['name'],
                'billing_cycle'  => $cycle,
                'poll_interval'  => 3000,
            ], 200);

        } catch (Exception $e) {
            Log::error('NexumPay Initiate Error: ' . $e->getMessage(), [
                'reference_id' => $referenceId,
                'client_ref'   => $clientRef,
            ]);

            if ($transaction) {
                try {
                    $transaction->update([
                        'status'         => 'FAILED',
                        'failure_reason' => $e->getMessage(),
                    ]);
                } catch (Exception $ignore) {}
            }

            $cachedRecord['status'] = 'FAILED';
            $cachedRecord['failure_reason'] = $e->getMessage();
            $this->saveCachedTransaction($referenceId, $clientRef, $cachedRecord);

            return response()->json([
                'success'      => false,
                'message'      => $e->getMessage(),
                'reference_id' => $referenceId,
                'client_ref'   => $clientRef,
                'status'       => 'FAILED',
            ], 400);
        }
    }

    /**
     * GET /api/nexumpay/status/{reference}
     * Polls NexumPay /platform/api/transaction_status by reference_id or client_ref.
     */
    public function status(string $reference)
    {
        $transaction = null;
        try {
            $transaction = NexumPayTransaction::where('reference_id', $reference)
                ->orWhere('client_ref', $reference)
                ->first();
        } catch (Exception $e) {
            // Fallback to cache
        }

        $cached = $this->getCachedTransaction($reference);

        if (!$transaction && !$cached) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction reference not found.',
            ], 404);
        }

        $currentStatus = strtoupper($transaction?->status ?? $cached['status'] ?? 'PENDING');
        $clientRef     = $transaction?->client_ref ?? $cached['client_ref'] ?? $reference;

        // If already finalized (SUCCESSFUL or FAILED), return stored state
        if (in_array($currentStatus, ['SUCCESSFUL', 'SUCCESS', 'FAILED', 'REJECTED', 'TIMEOUT'], true)) {
            $normalizedStatus = ($currentStatus === 'SUCCESS') ? 'SUCCESSFUL' : $currentStatus;
            return response()->json([
                'success'     => true,
                'status'      => $normalizedStatus,
                'transaction' => $this->formatTransactionPayload($transaction, $cached),
            ]);
        }

        // Poll live status from NexumPay API
        try {
            $statusResult = $this->nexumPay->checkTransactionStatus($clientRef);
            $txState      = $statusResult['tx_state'] ?? 'PENDING';
            $details      = $statusResult['details'] ?? [];

            if ($txState === 'SUCCESSFUL') {
                $internalRef = $details['internal_ref'] ?? ('NXP-INT-' . strtoupper(Str::random(8)));

                if ($transaction) {
                    $transaction->update([
                        'status'           => 'SUCCESSFUL',
                        'internal_ref'     => $internalRef,
                        'charge'           => (float) ($details['charge'] ?? 0.00),
                        'transaction_date' => $details['transaction_date'] ?? now(),
                        'raw_response'     => $statusResult['raw'] ?? $statusResult,
                    ]);
                }

                if ($cached) {
                    $cached['status']                   = 'SUCCESSFUL';
                    $cached['financial_transaction_id'] = $internalRef;
                    $cached['internal_ref']             = $internalRef;
                    $cached['charge']                   = $details['charge'] ?? '0.00';
                    $cached['transaction_date']         = $details['transaction_date'] ?? now()->toDateTimeString();
                    $this->saveCachedTransaction($cached['reference_id'], $clientRef, $cached);
                }

                $tenant = $this->activateSubscription($transaction, $cached);

                return response()->json([
                    'success'     => true,
                    'status'      => 'SUCCESSFUL',
                    'transaction' => $this->formatTransactionPayload($transaction?->fresh(), $cached, $details, $tenant),
                ]);

            } elseif ($txState === 'FAILED') {
                $detailsReason = $details['reason']
                    ?? $details['message']
                    ?? $details['failure_reason']
                    ?? null;

                $rawMsg = !empty($statusResult['message']) ? $statusResult['message'] : null;

                if (!empty($detailsReason)) {
                    $reason = $detailsReason;
                } elseif (!empty($rawMsg) && !str_contains(strtolower($rawMsg), 'status is: failed')) {
                    $reason = $rawMsg;
                } else {
                    $chargeAmount = !empty($details['amount']) ? number_format((float) $details['amount']) : null;
                    $phone = $transaction?->phone_number ?? $cached['customer_phone'] ?? 'your phone';
                    $reason = "Payment was declined or cancelled on {$phone}" . ($chargeAmount ? " (Total requested: UGX {$chargeAmount})" : "") . ". Please confirm you have sufficient Mobile Money balance (including telecom fees) and approve the USSD prompt with your PIN.";
                }

                if ($transaction) {
                    $transaction->update([
                        'status'         => 'FAILED',
                        'failure_reason' => $reason,
                        'raw_response'   => $statusResult['raw'] ?? $statusResult,
                    ]);
                }

                if ($cached) {
                    $cached['status']         = 'FAILED';
                    $cached['failure_reason'] = $reason;
                    $this->saveCachedTransaction($cached['reference_id'], $clientRef, $cached);
                }

                return response()->json([
                    'success'     => true,
                    'status'      => 'FAILED',
                    'transaction' => $this->formatTransactionPayload($transaction?->fresh(), $cached, $details),
                ]);
            }

            return response()->json([
                'success'     => true,
                'status'      => 'PENDING',
                'transaction' => $this->formatTransactionPayload($transaction, $cached, $details),
            ]);

        } catch (Exception $e) {
            Log::warning('NexumPay status poll warning: ' . $e->getMessage());

            return response()->json([
                'success'     => true,
                'status'      => $currentStatus,
                'transaction' => $this->formatTransactionPayload($transaction, $cached),
                'poll_error'  => $e->getMessage(),
            ]);
        }
    }

    /**
     * POST /api/nexumpay/simulate/{reference}
     * Allows simulating USSD PIN approval or decline when running in Simulation Mode.
     */
    public function simulate(Request $request, string $reference)
    {
        $action = strtoupper($request->input('action', 'SUCCESS')); // 'SUCCESS' | 'FAILED'

        $transaction = null;
        try {
            $transaction = NexumPayTransaction::where('reference_id', $reference)
                ->orWhere('client_ref', $reference)
                ->first();
        } catch (Exception $e) {}

        $cached = $this->getCachedTransaction($reference);

        if (!$transaction && !$cached) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found for simulation.',
            ], 404);
        }

        $clientRef   = $transaction?->client_ref ?? $cached['client_ref'] ?? $reference;
        $referenceId = $transaction?->reference_id ?? $cached['reference_id'] ?? $reference;
        $internalRef = (string) Str::uuid();

        if ($action === 'FAILED') {
            $reason = 'Customer cancelled the Mobile Money PIN prompt on their phone.';
            if ($transaction) {
                try {
                    $transaction->update([
                        'status'         => 'FAILED',
                        'failure_reason' => $reason,
                    ]);
                } catch (Exception $e) {}
            }
            if ($cached) {
                $cached['status']         = 'FAILED';
                $cached['failure_reason'] = $reason;
                $this->saveCachedTransaction($referenceId, $clientRef, $cached);
            }

            return response()->json([
                'success'     => true,
                'status'      => 'FAILED',
                'transaction' => $this->formatTransactionPayload($transaction?->fresh(), $cached),
            ]);
        }

        // Default: Approve (SUCCESSFUL)
        $simulatedDetails = [
            'business_name'    => 'StockPro Business Wallet',
            'source_mobile'    => $transaction?->msisdn ?? ($cached['msisdn'] ?? ''),
            'status'           => 'SUCCESS',
            'amount'           => number_format((float) ($transaction?->amount ?? $cached['amount'] ?? 0), 2, '.', ''),
            'narration'        => $transaction?->narration ?? 'StockPro Subscription',
            'transaction_date' => now()->format('Y-m-d H:i:s'),
            'internal_ref'     => $internalRef,
            'client_ref'       => $clientRef,
            'charge'           => '0.00',
            'trans_type'       => 'COLLECTION',
        ];

        if ($transaction) {
            try {
                $transaction->update([
                    'status'           => 'SUCCESSFUL',
                    'internal_ref'     => $internalRef,
                    'transaction_date' => now(),
                    'raw_response'     => [
                        'status'  => 'OK',
                        'message' => 'Your transaction status is: SUCCESS',
                        'details' => $simulatedDetails,
                    ],
                ]);
            } catch (Exception $e) {}
        }

        if ($cached) {
            $cached['status']                   = 'SUCCESSFUL';
            $cached['financial_transaction_id'] = $internalRef;
            $cached['internal_ref']             = $internalRef;
            $cached['transaction_date']         = $simulatedDetails['transaction_date'];
            $this->saveCachedTransaction($referenceId, $clientRef, $cached);
        }

        $tenant = $this->activateSubscription($transaction, $cached);

        return response()->json([
            'success'     => true,
            'status'      => 'SUCCESSFUL',
            'transaction' => $this->formatTransactionPayload($transaction?->fresh(), $cached, $simulatedDetails, $tenant),
        ]);
    }

    /**
     * POST /api/nexumpay/webhook
     * Receives asynchronous callback notifications from NexumPay (`call_back_url`).
     */
    public function webhook(Request $request)
    {
        Log::info('NexumPay Webhook Received', [
            'payload' => $request->all(),
            'headers' => $request->headers->all(),
        ]);

        $payload = $request->all();
        $details = $payload['details'] ?? $payload;

        $clientRef = $details['client_ref']
            ?? $details['reference']
            ?? $payload['client_ref']
            ?? $payload['reference']
            ?? null;

        if (!$clientRef) {
            return response()->json(['status' => 'Fail', 'message' => 'Missing client_ref or reference'], 400);
        }

        $transaction = null;
        try {
            $transaction = NexumPayTransaction::where('client_ref', $clientRef)
                ->orWhere('reference_id', $clientRef)
                ->first();
        } catch (Exception $e) {}

        $cached = $this->getCachedTransaction($clientRef);

        if (!$transaction && !$cached) {
            Log::warning("NexumPay Webhook: Transaction not found for reference {$clientRef}");
            return response()->json(['status' => 'Fail', 'message' => 'Transaction not found'], 404);
        }

        $rawStatus   = strtoupper((string) ($details['status'] ?? $payload['status'] ?? ''));
        $internalRef = $details['internal_ref'] ?? $payload['internal_ref'] ?? null;

        if (in_array($rawStatus, ['SUCCESS', 'SUCCESSFUL', 'OK', 'COMPLETED'], true)) {
            if ($transaction) {
                $transaction->update([
                    'status'           => 'SUCCESSFUL',
                    'internal_ref'     => $internalRef,
                    'charge'           => (float) ($details['charge'] ?? 0.00),
                    'transaction_date' => $details['transaction_date'] ?? now(),
                    'webhook_payload'  => $payload,
                ]);
            }
            if ($cached) {
                $cached['status']                   = 'SUCCESSFUL';
                $cached['financial_transaction_id'] = $internalRef;
                $cached['internal_ref']             = $internalRef;
                $this->saveCachedTransaction($cached['reference_id'], $clientRef, $cached);
            }

            $this->activateSubscription($transaction, $cached);

        } elseif (in_array($rawStatus, ['FAILED', 'FAIL', 'REJECTED', 'CANCELLED'], true)) {
            $reason = $payload['message'] ?? $details['message'] ?? 'Payment failed on Mobile Money network.';
            if ($transaction) {
                $transaction->update([
                    'status'          => 'FAILED',
                    'failure_reason'  => $reason,
                    'webhook_payload' => $payload,
                ]);
            }
            if ($cached) {
                $cached['status']         = 'FAILED';
                $cached['failure_reason'] = $reason;
                $this->saveCachedTransaction($cached['reference_id'], $clientRef, $cached);
            }
        }

        return response()->json(['status' => 'OK', 'message' => 'Webhook processed']);
    }

    /**
     * Activate or extend the Tenant's subscription upon successful payment.
     */
    protected function activateSubscription(?NexumPayTransaction $transaction, ?array $cached): ?Tenant
    {
        $tenantId      = $transaction?->tenant_id ?? ($cached['tenant_id'] ?? null);
        $customerEmail = $transaction?->customer_email ?? ($cached['customer_email'] ?? null);
        $planId        = $transaction?->plan_id ?? ($cached['plan_id'] ?? 'starter');
        $billingCycle  = $transaction?->billing_cycle ?? ($cached['billing_cycle'] ?? 'monthly');

        $durationMonths = ($billingCycle === 'annual') ? 12 : 1;
        $expiresAt      = now()->addMonths($durationMonths);

        if ($customerEmail) {
            try {
                Cache::put('nexumpay_paid_sub_' . strtolower(trim($customerEmail)), [
                    'subscription_plan'       => $planId,
                    'subscription_status'     => 'active',
                    'subscription_expires_at' => $expiresAt->toDateTimeString(),
                    'billing_cycle'           => $billingCycle,
                ], now()->addDays(7));
            } catch (Exception $e) {}
        }

        try {
            $tenant = null;
            if ($tenantId) {
                $tenant = Tenant::find($tenantId);
            }
            if (!$tenant && !empty($customerEmail)) {
                $tenant = Tenant::where('email', $customerEmail)->first();
            }

            if ($tenant) {
                $tenant->update([
                    'subscription_plan'       => $planId,
                    'subscription_status'     => 'active',
                    'subscription_expires_at' => $expiresAt,
                ]);

                Log::info("NexumPay: Activated {$planId} ({$billingCycle}) subscription for Tenant #{$tenant->id} until {$expiresAt}");
                return $tenant->fresh();
            }
        } catch (Exception $e) {
            Log::warning('NexumPay: Could not update tenant subscription columns: ' . $e->getMessage());
        }

        return null;
    }

    /**
     * Format unified transaction payload for the frontend Checkout UI.
     */
    protected function formatTransactionPayload(
        ?NexumPayTransaction $transaction,
        ?array $cached,
        array $gatewayDetails = [],
        ?Tenant $tenant = null
    ): array {
        $referenceId = $transaction?->reference_id ?? ($cached['reference_id'] ?? '');
        $clientRef   = $transaction?->client_ref ?? ($cached['client_ref'] ?? '');
        $internalRef = $transaction?->internal_ref
            ?? ($gatewayDetails['internal_ref'] ?? ($cached['internal_ref'] ?? null));

        $phone = $gatewayDetails['source_mobile']
            ?? $transaction?->phone_number
            ?? ($cached['customer_phone'] ?? '');

        return [
            'reference_id'             => $referenceId,
            'client_ref'               => $clientRef,
            'external_id'              => $clientRef,
            'internal_ref'             => $internalRef,
            'financial_transaction_id' => $internalRef,
            'status'                   => $transaction?->status ?? ($cached['status'] ?? 'PENDING'),
            'plan_id'                  => $transaction?->plan_id ?? ($cached['plan_id'] ?? 'starter'),
            'plan_name'                => $transaction?->plan_name ?? ($cached['plan_name'] ?? 'Starter Plan'),
            'billing_cycle'            => $transaction?->billing_cycle ?? ($cached['billing_cycle'] ?? 'monthly'),
            'amount'                   => (float) ($transaction?->amount ?? ($cached['amount'] ?? 0)),
            'currency'                 => 'UGX',
            'charge'                   => $gatewayDetails['charge'] ?? ($transaction?->charge ?? ($cached['charge'] ?? '0.00')),
            'customer_name'            => $transaction?->customer_name ?? ($cached['customer_name'] ?? ''),
            'customer_email'           => $transaction?->customer_email ?? ($cached['customer_email'] ?? ''),
            'customer_phone'           => $phone,
            'network'                  => $transaction?->network ?? ($cached['network'] ?? $this->nexumPay->detectNetwork((string) $phone)),
            'failure_reason'           => $transaction?->failure_reason ?? ($cached['failure_reason'] ?? null),
            'transaction_date'         => $gatewayDetails['transaction_date']
                ?? ($transaction?->transaction_date?->format('Y-m-d H:i:s') ?? ($cached['transaction_date'] ?? now()->format('Y-m-d H:i:s'))),
            'tenant_subscription'      => $tenant ? [
                'subscription_plan'       => $tenant->subscription_plan,
                'subscription_status'     => $tenant->subscription_status,
                'subscription_expires_at' => $tenant->subscription_expires_at,
            ] : null,
        ];
    }

    protected function saveCachedTransaction(string $referenceId, string $clientRef, array $data): void
    {
        try {
            Cache::put('nexumpay_tx_' . $referenceId, $data, 3600);
            Cache::put('nexumpay_tx_' . $clientRef, $data, 3600);
        } catch (Exception $e) {}
    }

    protected function getCachedTransaction(string $reference): ?array
    {
        try {
            return Cache::get('nexumpay_tx_' . $reference);
        } catch (Exception $e) {
            return null;
        }
    }
}
