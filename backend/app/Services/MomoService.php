<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Exception;

class MomoService
{
    protected string $baseUrl;
    protected string $environment;
    protected string $targetEnvironment;
    protected string $subscriptionKey;
    protected string $apiUserId;
    protected string $apiKey;
    protected string $currency;
    protected ?string $callbackUrl;

    public function __construct()
    {
        $this->baseUrl           = rtrim(config('momo.base_url', 'https://sandbox.momodeveloper.mtn.com'), '/');
        $this->environment       = config('momo.environment', 'sandbox');
        $this->targetEnvironment = config('momo.target_environment', 'sandbox');
        $this->subscriptionKey   = trim((string) config('momo.subscription_key', ''));
        $this->apiUserId         = trim((string) config('momo.api_user_id', ''));
        $this->apiKey            = trim((string) config('momo.api_key', ''));
        $this->currency          = config('momo.currency', 'EUR');
        $this->callbackUrl       = config('momo.callback_url');
    }

    /**
     * Check if necessary API credentials are configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->subscriptionKey) && !empty($this->apiUserId) && !empty($this->apiKey);
    }

    /**
     * Format phone number to international MSISDN without '+' sign (e.g., 256771234567).
     */
    public function formatMsisdn(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        // Standard Ugandan numbers starting with 07... (10 digits, e.g. 0781234567)
        if (str_starts_with($cleaned, '0') && strlen($cleaned) === 10) {
            return '256' . substr($cleaned, 1);
        }

        // 9-digit Ugandan numbers starting with 7... (e.g. 781234567)
        if (str_starts_with($cleaned, '7') && strlen($cleaned) === 9) {
            return '256' . $cleaned;
        }

        // If it starts with 256... (12 digits, e.g. 256781234567)
        if (str_starts_with($cleaned, '256') && strlen($cleaned) === 12) {
            return $cleaned;
        }

        // In sandbox, some test numbers are like 46733123453 (Sweden international sandbox format)
        if (strlen($cleaned) >= 9) {
            return $cleaned;
        }

        return $cleaned;
    }

    /**
     * Sanitize string parameters for MTN MoMo API.
     * MTN F5 Web Application Firewall strictly blocks characters like '#', '<', '>', '&', etc.
     */
    public function sanitizeText(string $text, int $maxLength = 30): string
    {
        $clean = preg_replace('/[^a-zA-Z0-9\s\.\-]/', '', $text);
        $clean = preg_replace('/\s+/', ' ', trim($clean));
        return substr($clean, 0, $maxLength);
    }


    /**
     * Generate or retrieve cached OAuth2 Bearer Access Token.
     */
    public function getAccessToken(): string
    {
        if (!$this->isConfigured()) {
            throw new Exception("MTN MoMo API credentials are not configured. Please check MOMO_API_USER_ID, MOMO_API_KEY, and MOMO_COLLECTION_SUBSCRIPTION_KEY in your .env file.");
        }

        $cacheKey = 'momo_token_' . md5($this->apiUserId . $this->subscriptionKey);

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $tokenUrl = $this->baseUrl . '/collection/token/';
        $basicAuth = base64_encode($this->apiUserId . ':' . $this->apiKey);

        Log::info('MTN MoMo: Requesting access token', ['url' => $tokenUrl, 'user' => $this->apiUserId]);

        $response = Http::withHeaders([
            'Authorization'             => 'Basic ' . $basicAuth,
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
        ])
        ->withoutVerifying() // Prevents Windows/cURL CA bundle mismatches
        ->post($tokenUrl);

        if (!$response->successful()) {
            $errorMsg = $response->json('message') ?? $response->body();
            Log::error('MTN MoMo Token Generation Failed', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new Exception("Failed to obtain MTN MoMo token (HTTP {$response->status()}): " . $errorMsg);
        }

        $data = $response->json();
        $accessToken = $data['access_token'] ?? null;
        $expiresIn = (int) ($data['expires_in'] ?? 3600);

        if (!$accessToken) {
            throw new Exception("MTN MoMo token endpoint returned invalid response without access_token.");
        }

        // Cache for slightly less than expiration time
        $cacheSeconds = max(60, $expiresIn - 300);
        Cache::put($cacheKey, $accessToken, $cacheSeconds);

        return $accessToken;
    }

    /**
     * Send Request to Pay (Collection).
     *
     * @param string $referenceId UUID v4 for the transaction
     * @param float $amount Amount to charge
     * @param string $currency Currency (EUR in sandbox, UGX in production)
     * @param string $phone MSISDN formatted phone number
     * @param string $externalId Order / Reference identifier
     * @param string $payerMessage Message shown to customer
     * @param string $payeeNote Note for your records
     * @return array
     */
    public function requestToPay(
        string $referenceId,
        float $amount,
        string $currency,
        string $phone,
        string $externalId,
        string $payerMessage = 'Subscription Payment',
        string $payeeNote = 'StockPro Service'
    ): array {
        $token = $this->getAccessToken();
        $msisdn = $this->formatMsisdn($phone);

        $url = $this->baseUrl . '/collection/v1_0/requesttopay';

        $headers = [
            'Authorization'             => 'Bearer ' . $token,
            'X-Reference-Id'            => $referenceId,
            'X-Target-Environment'      => $this->targetEnvironment,
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
            'Content-Type'              => 'application/json',
        ];

        // Only include callback URL if it's a public URL (MTN cannot call localhost directly)
        if (!empty($this->callbackUrl) && !str_contains($this->callbackUrl, 'localhost') && !str_contains($this->callbackUrl, '127.0.0.1')) {
            $headers['X-Callback-Url'] = $this->callbackUrl;
        }

        $cleanPayerMessage = $this->sanitizeText($payerMessage, 30);
        $cleanPayeeNote    = $this->sanitizeText($payeeNote, 30);

        $payload = [
            'amount'       => (string) $amount,
            'currency'     => $currency,
            'externalId'   => $externalId,
            'payer'        => [
                'partyIdType' => 'MSISDN',
                'partyId'     => $msisdn,
            ],
            'payerMessage' => $cleanPayerMessage,
            'payeeNote'    => $cleanPayeeNote,
        ];

        Log::info('MTN MoMo: Sending Request to Pay', [
            'referenceId'  => $referenceId,
            'msisdn'       => $msisdn,
            'amount'       => $amount,
            'currency'     => $currency,
            'payerMessage' => $cleanPayerMessage,
            'payeeNote'    => $cleanPayeeNote,
        ]);

        $response = Http::withHeaders($headers)
            ->withoutVerifying()
            ->post($url, $payload);

        // Check if response contains an HTML firewall block page (e.g. F5 BIG-IP WAF)
        $rawBody = $response->body();
        if (str_contains($rawBody, 'Request Rejected') || str_contains($rawBody, '<title>Request Rejected</title>')) {
            Log::error('MTN MoMo Firewall Block', ['body' => $rawBody]);
            throw new Exception("MTN MoMo Security Firewall rejected the payload. Please ensure special characters are excluded.");
        }

        // MTN RequestToPay returns 202 Accepted on success
        if ($response->status() !== 202) {
            $errorBody = $response->json() ?? $rawBody;
            Log::error('MTN MoMo RequestToPay Failed', [
                'status' => $response->status(),
                'body'   => $errorBody,
            ]);

            $message = is_array($errorBody) ? ($errorBody['message'] ?? json_encode($errorBody)) : $errorBody;
            throw new Exception("MTN MoMo RequestToPay error (HTTP {$response->status()}): " . $message);
        }


        return [
            'status'       => 'PENDING',
            'reference_id' => $referenceId,
            'msisdn'       => $msisdn,
            'amount'       => $amount,
            'currency'     => $currency,
        ];
    }

    /**
     * Poll transaction status for a given Reference ID.
     *
     * @param string $referenceId UUID v4
     * @return array
     */
    public function getTransactionStatus(string $referenceId): array
    {
        $token = $this->getAccessToken();
        $url = $this->baseUrl . '/collection/v1_0/requesttopay/' . $referenceId;

        $response = Http::withHeaders([
            'Authorization'             => 'Bearer ' . $token,
            'X-Target-Environment'      => $this->targetEnvironment,
            'Ocp-Apim-Subscription-Key' => $this->subscriptionKey,
        ])
        ->withoutVerifying()
        ->get($url);

        if (!$response->successful()) {
            Log::warning('MTN MoMo Get Status query returned non-200', [
                'referenceId' => $referenceId,
                'status'      => $response->status(),
                'body'        => $response->body(),
            ]);

            return [
                'status'         => 'PENDING',
                'error'          => $response->body(),
                'http_status'    => $response->status(),
            ];
        }

        $data = $response->json();
        return is_array($data) ? $data : ['status' => 'PENDING'];
    }

    /**
     * Return configured environment & safe metadata
     */
    public function getConfigSummary(): array
    {
        return [
            'is_configured'      => $this->isConfigured(),
            'environment'        => $this->environment,
            'target_environment' => $this->targetEnvironment,
            'currency'           => $this->currency,
            'has_subscription'   => !empty($this->subscriptionKey),
            'has_api_user'       => !empty($this->apiUserId),
            'has_api_key'        => !empty($this->apiKey),
        ];
    }
}
