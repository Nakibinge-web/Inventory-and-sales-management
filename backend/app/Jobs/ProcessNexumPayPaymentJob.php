<?php

namespace App\Jobs;

use App\Models\NexumPayTransaction;
use App\Models\Tenant;
use App\Services\NexumPayService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProcessNexumPayPaymentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public string $referenceId;
    public string $clientRef;
    public string $localPhone;
    public string $msisdn;
    public string $network;
    public float $amountUgx;
    public string $narration;
    public string $planId;
    public string $planName;
    public string $billingCycle;
    public string $customerName;
    public string $customerEmail;
    public string $businessName;
    public ?int $tenantId;
    public ?int $userId;
    public string $action;
    public array $webhookPayload;

    public function __construct(array $payload, string $action = 'initiate', array $webhookPayload = [])
    {
        $this->referenceId    = (string) ($payload['reference_id'] ?? '');
        $this->clientRef      = (string) ($payload['client_ref'] ?? '');
        $this->localPhone     = (string) ($payload['phone_number'] ?? $payload['customer_phone'] ?? '');
        $this->msisdn         = (string) ($payload['msisdn'] ?? '');
        $this->network        = (string) ($payload['network'] ?? 'MTN');
        $this->amountUgx      = (float) ($payload['amount'] ?? 0);
        $this->narration      = (string) ($payload['narration'] ?? 'StockPro Subscription');
        $this->planId         = (string) ($payload['plan_id'] ?? 'starter');
        $this->planName       = (string) ($payload['plan_name'] ?? 'Starter Plan');
        $this->billingCycle   = (string) ($payload['billing_cycle'] ?? 'monthly');
        $this->customerName   = (string) ($payload['customer_name'] ?? '');
        $this->customerEmail  = (string) ($payload['customer_email'] ?? '');
        $this->businessName   = (string) ($payload['business_name'] ?? $this->customerName);
        $this->tenantId       = isset($payload['tenant_id']) ? (int) $payload['tenant_id'] : null;
        $this->userId         = isset($payload['user_id']) ? (int) $payload['user_id'] : null;
        $this->action         = $action;
        $this->webhookPayload = $webhookPayload;
    }

    public function handle(NexumPayService $nexumPay): void
    {
        // 1. Ensure the transaction record is saved in nexumpay_transactions
        $transaction = null;
        try {
            $transaction = NexumPayTransaction::where('reference_id', $this->referenceId)
                ->orWhere('client_ref', $this->clientRef)
                ->first();

            if (!$transaction && $this->referenceId && $this->clientRef) {
                $transaction = NexumPayTransaction::create([
                    'reference_id'   => $this->referenceId,
                    'client_ref'     => $this->clientRef,
                    'tenant_id'      => $this->tenantId,
                    'user_id'        => $this->userId,
                    'customer_name'  => $this->customerName,
                    'customer_email' => $this->customerEmail,
                    'business_name'  => $this->businessName,
                    'phone_number'   => $this->localPhone,
                    'msisdn'         => $this->msisdn,
                    'network'        => $this->network,
                    'plan_id'        => $this->planId,
                    'plan_name'      => $this->planName,
                    'billing_cycle'  => $this->billingCycle,
                    'amount'         => $this->amountUgx,
                    'charge'         => 0.00,
                    'currency'       => 'UGX',
                    'status'         => 'PENDING',
                    'narration'      => $this->narration,
                ]);
            }
        } catch (Exception $e) {
            Log::warning('ProcessNexumPayPaymentJob: Could not query/create NexumPayTransaction: ' . $e->getMessage());
        }

        if ($this->action === 'webhook') {
            $this->handleWebhookProcessing($transaction);
            return;
        }

        // 2. Initiate payment collection with NexumPay API and persist result to nexumpay_transactions
        try {
            $gatewayResult = $nexumPay->requestPayment(
                $this->localPhone,
                $this->amountUgx,
                $this->narration,
                $this->clientRef
            );

            if ($transaction) {
                $transaction->update([
                    'status'       => 'PENDING',
                    'raw_response' => $gatewayResult['raw'] ?? $gatewayResult,
                ]);
            }

            $this->updateCache([
                'status'       => 'PENDING',
                'gateway_mode' => $gatewayResult['mode'] ?? 'live',
            ]);

            Log::info("ProcessNexumPayPaymentJob: Initiated and saved transaction {$this->clientRef} in nexumpay_transactions");
        } catch (Exception $e) {
            Log::error('ProcessNexumPayPaymentJob Initiate Error: ' . $e->getMessage(), [
                'reference_id' => $this->referenceId,
                'client_ref'   => $this->clientRef,
            ]);

            if ($transaction) {
                try {
                    $transaction->update([
                        'status'         => 'FAILED',
                        'failure_reason' => $e->getMessage(),
                    ]);
                } catch (Exception $ignore) {}
            }

            $this->updateCache([
                'status'         => 'FAILED',
                'failure_reason' => $e->getMessage(),
            ]);
        }
    }

    protected function handleWebhookProcessing(?NexumPayTransaction $transaction): void
    {
        $payload     = $this->webhookPayload;
        $details     = $payload['details'] ?? $payload;
        $rawStatus   = strtoupper((string) ($details['status'] ?? $payload['status'] ?? ''));
        $internalRef = $details['internal_ref'] ?? $payload['internal_ref'] ?? null;

        if (in_array($rawStatus, ['SUCCESS', 'SUCCESSFUL', 'OK', 'COMPLETED'], true)) {
            $shouldActivate = false;

            if ($transaction) {
                $affected = NexumPayTransaction::where('id', $transaction->id)
                    ->whereNotIn('status', ['SUCCESSFUL', 'SUCCESS'])
                    ->update([
                        'status'           => 'SUCCESSFUL',
                        'internal_ref'     => $internalRef,
                        'charge'           => (float) ($details['charge'] ?? 0.00),
                        'transaction_date' => $details['transaction_date'] ?? now(),
                        'webhook_payload'  => json_encode($payload),
                    ]);
                $transaction    = $transaction->fresh();
                $shouldActivate = ($affected > 0);
            }

            $cached = $this->getCached();
            if ($cached) {
                $cacheStatus = strtoupper((string) ($cached['status'] ?? 'PENDING'));
                if (!$transaction && !in_array($cacheStatus, ['SUCCESSFUL', 'SUCCESS'], true) && empty($cached['subscription_activated'])) {
                    $shouldActivate = true;
                }
            }

            $this->updateCache([
                'status'                   => 'SUCCESSFUL',
                'financial_transaction_id' => $internalRef,
                'internal_ref'             => $internalRef,
                'subscription_activated'   => true,
            ]);

            if ($shouldActivate) {
                $this->activateTenantSubscription($transaction);
            }
        } elseif (in_array($rawStatus, ['FAILED', 'FAIL', 'REJECTED', 'CANCELLED'], true)) {
            $reason = $payload['message'] ?? $details['message'] ?? 'Payment failed on Mobile Money network.';
            if ($transaction) {
                $transaction->update([
                    'status'          => 'FAILED',
                    'failure_reason'  => $reason,
                    'webhook_payload' => $payload,
                ]);
            }
            $this->updateCache([
                'status'         => 'FAILED',
                'failure_reason' => $reason,
            ]);
        }
    }

    protected function activateTenantSubscription(?NexumPayTransaction $transaction): void
    {
        $tenantId      = $transaction?->tenant_id ?? $this->tenantId;
        $customerEmail = $transaction?->customer_email ?? $this->customerEmail;
        $planId        = strtolower(trim((string) ($transaction?->plan_id ?? $this->planId ?: 'starter')));
        $billingCycle  = $transaction?->billing_cycle ?? $this->billingCycle ?: 'monthly';
        $txKey         = $transaction?->reference_id ?? ($this->referenceId ?: $this->clientRef);

        if ($txKey) {
            try {
                if (!Cache::add('nexumpay_sub_applied_' . $txKey, true, now()->addDays(30))) {
                    return;
                }
            } catch (Exception $e) {}
        }

        $durationDays   = Tenant::durationDaysForCycle($billingCycle);
        $resolvedExpiry = now()->addDays($durationDays);
        $updatedTenant  = null;

        try {
            $updatedTenant = DB::transaction(function () use ($tenantId, $customerEmail, $planId, $billingCycle) {
                $tenant = null;
                if ($tenantId) {
                    $tenant = Tenant::where('id', $tenantId)->lockForUpdate()->first();
                }
                if (!$tenant && !empty($customerEmail)) {
                    $tenant = Tenant::whereRaw('LOWER(email) = ?', [strtolower(trim($customerEmail))])->lockForUpdate()->first();
                }
                if (!$tenant) {
                    return null;
                }
                $tenant->applySubscriptionPurchase($planId, $billingCycle);
                return $tenant->fresh();
            });
        } catch (Exception $e) {
            Log::warning('ProcessNexumPayPaymentJob: Could not update tenant subscription: ' . $e->getMessage());
        }

        if ($updatedTenant) {
            $resolvedExpiry = $updatedTenant->subscription_expires_at ?? $resolvedExpiry;
        }

        if ($customerEmail) {
            try {
                Cache::put('nexumpay_paid_sub_' . strtolower(trim($customerEmail)), [
                    'subscription_plan'       => $planId,
                    'subscription_status'     => 'active',
                    'subscription_expires_at' => Carbon::parse($resolvedExpiry)->toDateTimeString(),
                    'billing_cycle'           => $billingCycle,
                ], now()->addDays(7));
            } catch (Exception $e) {}
        }
    }

    protected function getCached(): ?array
    {
        try {
            return Cache::get('nexumpay_tx_' . ($this->referenceId ?: $this->clientRef));
        } catch (Exception $e) {
            return null;
        }
    }

    protected function updateCache(array $updates): void
    {
        try {
            $existing = Cache::get('nexumpay_tx_' . $this->referenceId)
                ?? Cache::get('nexumpay_tx_' . $this->clientRef)
                ?? [];
            $merged = array_merge($existing, $updates);
            if ($this->referenceId) {
                Cache::put('nexumpay_tx_' . $this->referenceId, $merged, 3600);
            }
            if ($this->clientRef) {
                Cache::put('nexumpay_tx_' . $this->clientRef, $merged, 3600);
            }
        } catch (Exception $e) {}
    }
}
