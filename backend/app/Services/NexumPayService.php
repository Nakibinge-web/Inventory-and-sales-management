<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class NexumPayService
{
    protected string $baseUrl;
    protected string $walletAddress;
    protected string $authToken;
    protected string $username;
    protected string $password;
    protected ?string $callbackUrl;
    protected bool $simulationFallback;

    public function __construct()
    {
        $this->baseUrl            = rtrim((string) config('nexumpay.base_url', 'https://nexumpayapi.araknerd.com'), '/');
        $this->walletAddress      = trim((string) config('nexumpay.wallet_address', ''));
        $this->authToken          = trim((string) config('nexumpay.auth_token', ''));
        $this->username           = trim((string) config('nexumpay.username', ''));
        $this->password           = trim((string) config('nexumpay.password', ''));
        $this->callbackUrl        = config('nexumpay.callback_url');
        $this->simulationFallback = (bool) config('nexumpay.simulation_mode', false);
    }

    /**
     * Check if live NexumPay credentials are provided in .env.
     */
    public function isConfigured(): bool
    {
        $hasWallet = !empty($this->walletAddress);
        $hasSecret = !empty($this->authToken) || (!empty($this->username) && !empty($this->password));

        return $hasWallet && $hasSecret;
    }

    /**
     * Check if running in local simulation fallback mode (when live keys aren't set yet).
     */
    public function isSimulationMode(): bool
    {
        return !$this->isConfigured() && $this->simulationFallback;
    }

    /**
     * Normalize Ugandan phone number to 10-digit local format (e.g. 0771234567)
     * as expected by NexumPay's /platform/api/request_payment endpoint.
     */
    public function formatLocalPhone(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // +2567XXXXXXXX or 2567XXXXXXXX (12 digits) -> 07XXXXXXXX
        if (str_starts_with($cleaned, '256') && strlen($cleaned) === 12) {
            return '0' . substr($cleaned, 3);
        }

        // 7XXXXXXXX (9 digits) -> 07XXXXXXXX
        if (strlen($cleaned) === 9 && (str_starts_with($cleaned, '7') || str_starts_with($cleaned, '3') || str_starts_with($cleaned, '2'))) {
            return '0' . $cleaned;
        }

        // Already 07XXXXXXXX (10 digits)
        if (str_starts_with($cleaned, '0') && strlen($cleaned) === 10) {
            return $cleaned;
        }

        return $cleaned;
    }

    /**
     * Normalize phone number to international MSISDN without '+' (e.g. 256771234567).
     */
    public function formatMsisdn(string $phone): string
    {
        $local = $this->formatLocalPhone($phone);

        if (str_starts_with($local, '0') && strlen($local) === 10) {
            return '256' . substr($local, 1);
        }

        return $local;
    }

    /**
     * Detect Ugandan Mobile Money network from phone prefix.
     */
    public function detectNetwork(string $phone): string
    {
        $local = $this->formatLocalPhone($phone);
        $prefix = substr($local, 0, 3);

        if (in_array($prefix, ['077', '078', '076', '039'], true)) {
            return 'MTN Mobile Money';
        }

        if (in_array($prefix, ['070', '075', '074', '020'], true)) {
            return 'Airtel Money';
        }

        return 'Mobile Money';
    }

    /**
     * Step 1: Retrieve the NexumPay Auth Token (Secret).
     * Uses NEXUMPAY_AUTH_TOKEN from .env, or fetches programmatically via /platform/api/generate_auth_token.
     */
    public function getAuthToken(): string
    {
        if (!empty($this->authToken)) {
            return $this->authToken;
        }

        if (empty($this->walletAddress) || empty($this->username) || empty($this->password)) {
            throw new Exception(
                'NexumPay credentials are not configured. Please set NEXUMPAY_WALLET_ADDRESS and NEXUMPAY_AUTH_TOKEN in backend/.env.'
            );
        }

        $cacheKey = 'nexumpay_auth_token_' . md5($this->walletAddress . ':' . $this->username);

        try {
            if (Cache::has($cacheKey)) {
                return (string) Cache::get($cacheKey);
            }
        } catch (Exception $e) {
            // Ignore cache driver issues
        }

        $url = $this->baseUrl . '/platform/api/generate_auth_token';

        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])
        ->withoutVerifying()
        ->timeout(20)
        ->post($url, [
            'username'       => $this->username,
            'password'       => $this->password,
            'wallet_address' => $this->walletAddress,
        ]);

        $data = $response->json();

        if (!$response->successful() || strtoupper((string) ($data['status'] ?? '')) !== 'OK') {
            $msg = $data['message'] ?? (is_string($data['details'] ?? null) ? $data['details'] : null) ?? $response->body();
            if (is_array($msg)) {
                $msg = json_encode($msg);
            }
            Log::error('NexumPay: Failed to generate Auth Token', [
                'status' => $response->status(),
                'body'   => $data ?? $response->body(),
            ]);
            throw new Exception('NexumPay Auth Token error: ' . $msg);
        }

        $token = $data['details']['auth_token']
            ?? $data['details']['token']
            ?? $data['auth_token']
            ?? $data['token']
            ?? null;

        if (!$token) {
            throw new Exception('NexumPay generate_auth_token did not return a valid token.');
        }

        try {
            Cache::put($cacheKey, $token, 3600);
        } catch (Exception $e) {
            // Ignore cache driver issues
        }

        return (string) $token;
    }

    /**
     * Step 2: Exchange the Auth Token + Wallet Address for a short-lived API Key (valid 120s).
     * Endpoint: POST /platform/api/generate_api_key
     */
    public function generateApiKey(bool $forceRefresh = false): string
    {
        $authToken = $this->getAuthToken();
        $cacheKey = 'nexumpay_api_key_' . md5($this->walletAddress . ':' . $authToken);

        if (!$forceRefresh) {
            try {
                if (Cache::has($cacheKey)) {
                    return (string) Cache::get($cacheKey);
                }
            } catch (Exception $e) {
                // Ignore cache driver issues
            }
        }

        $url = $this->baseUrl . '/platform/api/generate_api_key';

        Log::info('NexumPay: Generating short-lived API key', [
            'url'            => $url,
            'wallet_address' => $this->walletAddress,
        ]);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $authToken,
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ])
        ->withoutVerifying()
        ->timeout(20)
        ->post($url, [
            'wallet_address' => $this->walletAddress,
        ]);

        $data = $response->json();

        if (!$response->successful() || strtoupper((string) ($data['status'] ?? '')) !== 'OK') {
            $msg = $data['message'] ?? (is_string($data['details'] ?? null) ? $data['details'] : null) ?? $response->body();
            if (is_array($msg)) {
                $msg = json_encode($msg);
            }
            Log::error('NexumPay: generate_api_key failed', [
                'http_status' => $response->status(),
                'response'    => $data ?? $response->body(),
            ]);
            throw new Exception('NexumPay API key generation failed: ' . $msg);
        }

        $apiKey = $data['details']['api_key'] ?? $data['api_key'] ?? null;

        if (!$apiKey) {
            throw new Exception('NexumPay generate_api_key response missing details.api_key.');
        }

        // NexumPay API keys expire in 120 seconds; cache for 85 seconds
        try {
            Cache::put($cacheKey, $apiKey, 85);
        } catch (Exception $e) {
            // Ignore cache driver issues
        }

        return (string) $apiKey;
    }

    /**
     * Step 3: Initiate Mobile Money Collection (Request Payment).
     * Endpoint: POST /platform/api/request_payment
     */
    public function requestPayment(
        string $phone,
        float|int $amount,
        string $narration,
        string $reference,
        ?string $customCallbackUrl = null
    ): array {
        $localPhone = $this->formatLocalPhone($phone);
        $msisdn     = $this->formatMsisdn($phone);
        $network    = $this->detectNetwork($phone);
        $callback   = $customCallbackUrl ?: ($this->callbackUrl ?: url('/api/nexumpay/webhook'));

        // Simulation Mode fallback when live credentials aren't configured yet
        if ($this->isSimulationMode()) {
            Log::info('NexumPay [SIMULATION]: Initiated collection request', [
                'phone_number' => $localPhone,
                'amount'       => (string) round($amount),
                'narration'    => $narration,
                'reference'    => $reference,
                'network'      => $network,
            ]);

            return [
                'status'       => 'OK',
                'mode'         => 'simulation',
                'message'      => "Simulated USSD push sent to {$localPhone} ({$network}). Use the Simulate Approval button or wait for confirmation.",
                'reference'    => $reference,
                'phone_number' => $localPhone,
                'msisdn'       => $msisdn,
                'network'      => $network,
                'amount'       => (string) round($amount),
            ];
        }

        $apiKey = $this->generateApiKey();
        $url    = $this->baseUrl . '/platform/api/request_payment';

        $payload = [
            'phone_number'  => $localPhone,
            'amount'        => (string) round($amount),
            'narration'     => substr(trim($narration), 0, 100),
            'reference'     => $reference,
            'call_back_url' => $callback,
        ];

        Log::info('NexumPay: Sending request_payment', [
            'url'     => $url,
            'payload' => $payload,
        ]);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ])
        ->withoutVerifying()
        ->timeout(30)
        ->post($url, $payload);

        $data = $response->json();

        $statusField = strtoupper((string) ($data['status'] ?? ''));

        if (!$response->successful() || $statusField !== 'OK') {
            $errorMsg = $data['message'] ?? (is_string($data['details'] ?? null) ? $data['details'] : null) ?? $response->body() ?: "HTTP {$response->status()}";
            if (is_array($errorMsg)) {
                $errorMsg = json_encode($errorMsg);
            }
            Log::error('NexumPay: request_payment failed', [
                'http_status' => $response->status(),
                'response'    => $data ?? $response->body(),
            ]);

            throw new Exception('NexumPay payment request failed: ' . $errorMsg);
        }

        return [
            'status'       => 'OK',
            'mode'         => 'live',
            'message'      => $data['message'] ?? 'Payment collection request sent to customer phone.',
            'reference'    => $reference,
            'phone_number' => $localPhone,
            'msisdn'       => $msisdn,
            'network'      => $network,
            'amount'       => (string) round($amount),
            'raw'          => $data,
        ];
    }

    /**
     * Step 4: Check Transaction Status.
     * Endpoint: POST /platform/api/transaction_status
     * Body: { "client_ref": "<reference>" }
     */
    public function checkTransactionStatus(string $clientRef): array
    {
        if ($this->isSimulationMode()) {
            return [
                'status'  => 'OK',
                'mode'    => 'simulation',
                'tx_state'=> 'PENDING',
                'details' => [
                    'client_ref' => $clientRef,
                    'status'     => 'PENDING',
                ],
            ];
        }

        $apiKey = $this->generateApiKey();
        $url    = $this->baseUrl . '/platform/api/transaction_status';

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type'  => 'application/json',
            'Accept'        => 'application/json',
        ])
        ->withoutVerifying()
        ->timeout(20)
        ->post($url, [
            'client_ref' => $clientRef,
        ]);

        // If 401 Unauthorized, try refreshing the 120s API key once
        if ($response->status() === 401) {
            $apiKey = $this->generateApiKey(true);
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type'  => 'application/json',
                'Accept'        => 'application/json',
            ])
            ->withoutVerifying()
            ->timeout(20)
            ->post($url, [
                'client_ref' => $clientRef,
            ]);
        }

        if (!$response->successful()) {
            Log::warning('NexumPay: transaction_status returned non-200', [
                'client_ref'  => $clientRef,
                'http_status' => $response->status(),
                'body'        => $response->body(),
            ]);

            return [
                'status'   => 'PENDING',
                'tx_state' => 'PENDING',
                'details'  => ['client_ref' => $clientRef, 'status' => 'PENDING'],
            ];
        }

        $data    = $response->json() ?? [];
        $details = $data['details'] ?? [];

        // NexumPay returns details.status as 'PENDING', 'SUCCESS', or 'FAILED'
        $rawTxStatus = strtoupper((string) ($details['status'] ?? $data['transaction_status'] ?? 'PENDING'));

        $normalized = 'PENDING';
        if (in_array($rawTxStatus, ['SUCCESS', 'SUCCESSFUL', 'COMPLETED'], true)) {
            $normalized = 'SUCCESSFUL';
        } elseif (in_array($rawTxStatus, ['FAILED', 'FAIL', 'REJECTED', 'CANCELLED', 'TIMEOUT'], true)) {
            $normalized = 'FAILED';
        }

        return [
            'status'   => $data['status'] ?? 'OK',
            'message'  => $data['message'] ?? '',
            'tx_state' => $normalized,
            'details'  => $details,
            'raw'      => $data,
        ];
    }

    /**
     * Diagnostic configuration summary for frontend status badge.
     */
    public function getConfigSummary(): array
    {
        $maskedWallet = '';
        if (!empty($this->walletAddress)) {
            $len = strlen($this->walletAddress);
            $maskedWallet = $len > 6
                ? substr($this->walletAddress, 0, 4) . '••••' . substr($this->walletAddress, -4)
                : $this->walletAddress;
        }

        return [
            'gateway'           => 'NexumPay',
            'provider'          => 'Araknerd Company Limited (Uganda)',
            'base_url'          => $this->baseUrl,
            'is_configured'     => $this->isConfigured(),
            'mode'              => $this->isConfigured() ? 'live' : ($this->simulationFallback ? 'simulation' : 'unconfigured'),
            'has_wallet'        => !empty($this->walletAddress),
            'has_auth_token'    => !empty($this->authToken),
            'wallet_masked'     => $maskedWallet,
            'supported_networks'=> ['MTN Mobile Money', 'Airtel Money'],
            'currency'          => 'UGX',
        ];
    }
}

