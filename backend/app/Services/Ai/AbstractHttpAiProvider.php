<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

abstract class AbstractHttpAiProvider implements AiProviderInterface
{
    protected function httpClient(?int $ipResolve = null): PendingRequest
    {
        $connectTimeout = max(5, (int) config('ai.connect_timeout', 10));
        $timeout        = max(10, (int) config('ai.timeout', 25));
        $client         = Http::connectTimeout($connectTimeout)->timeout($timeout);

        $options  = [];
        $curlOpts = [];

        $caBundle = $this->resolveCaBundle();
        if ($caBundle !== null) {
            $options['verify'] = $caBundle;
        } elseif (defined('CURLSSLOPT_NATIVE_CA')) {
            // Fall back to the Windows OS root certificate store without blocking on offline CRL lookups.
            $sslFlags = CURLSSLOPT_NATIVE_CA;
            if (defined('CURLSSLOPT_NO_REVOKE')) {
                $sslFlags |= CURLSSLOPT_NO_REVOKE;
            }
            $curlOpts[CURLOPT_SSL_OPTIONS] = $sslFlags;
        }

        if ($ipResolve !== null && defined('CURLOPT_IPRESOLVE')) {
            $curlOpts[CURLOPT_IPRESOLVE] = $ipResolve;
        }

        if ($curlOpts !== []) {
            $options['curl'] = $curlOpts;
        }

        return $options !== [] ? $client->withOptions($options) : $client;
    }

    /**
     * Send a JSON POST request with an automatic IPv4 fallback retry if the initial
     * dual-stack connection fails due to broken IPv6 routing or transient DNS errors.
     */
    protected function postJson(string $endpoint, array $headers, array $payload): Response
    {
        try {
            return $this->httpClient()
                ->withHeaders($headers)
                ->post($endpoint, $payload);
        } catch (ConnectionException $firstException) {
            Log::warning('AI provider primary connection attempt failed', [
                'provider' => $this->name(),
                'error'    => $firstException->getMessage(),
            ]);

            if (!defined('CURL_IPRESOLVE_V4') || $this->isCertificateFailure($firstException)) {
                throw $firstException;
            }

            if (!app()->runningUnitTests()) {
                usleep(200_000);
            }

            try {
                return $this->httpClient(CURL_IPRESOLVE_V4)
                    ->withHeaders($headers)
                    ->post($endpoint, $payload);
            } catch (ConnectionException $retryException) {
                Log::error('AI provider IPv4 fallback attempt failed', [
                    'provider' => $this->name(),
                    'error'    => $retryException->getMessage(),
                ]);

                throw $retryException;
            }
        }
    }

    protected function isCertificateFailure(\Throwable $e): bool
    {
        $msg = $e->getMessage();

        return preg_match('/\bcURL error (?:60|77)\b/i', $msg) === 1
            || str_contains($msg, 'SSL certificate');
    }

    protected function isHostUnreachable(\Throwable $e): bool
    {
        $msg = $e->getMessage();

        if ($this->isCertificateFailure($e)) {
            return true;
        }

        if (preg_match('/\bcURL error (?:6|7|35)\b/i', $msg) === 1) {
            return true;
        }

        return preg_match('/\bcURL error 28\b/i', $msg) === 1
            && str_contains($msg, 'Connection timed out');
    }

    protected function resolveCaBundle(): ?string
    {
        $candidates = array_filter([
            config('ai.ca_bundle'),
            config('services.mistral.ca_bundle'),
            config('services.gemini.ca_bundle'),
            ini_get('curl.cainfo') ?: null,
            ini_get('openssl.cafile') ?: null,
            'C:\\tools\\php85\\extras\\ssl\\cacert.pem',
            'C:\\php\\cacert.pem',
            'C:\\php\\extras\\ssl\\cacert.pem',
            'D:\\xampp\\apache\\bin\\curl-ca-bundle.crt',
            'D:\\xampp\\php\\extras\\ssl\\cacert.pem',
            'C:\\xampp\\apache\\bin\\curl-ca-bundle.crt',
            'C:\\xampp\\php\\extras\\ssl\\cacert.pem',
            'C:\\Program Files\\Common Files\\SSL\\cert.pem',
            'C:\\Program Files\\Git\\mingw64\\etc\\ssl\\certs\\ca-bundle.crt',
            'C:\\Program Files\\Git\\usr\\ssl\\cert.pem',
        ]);

        foreach ($candidates as $path) {
            $path = trim((string) $path);
            if ($path !== '' && is_file($path) && @filesize($path) > 0) {
                return $path;
            }
        }

        return null;
    }

    protected function connectionErrorMessage(\Throwable $e): string
    {
        $detail     = $e->getMessage();
        $codeSuffix = '';
        if (preg_match('/cURL error \d+/i', $detail, $matches)) {
            $codeSuffix = ' [' . $matches[0] . ']';
        }

        if ($this->isCertificateFailure($e)) {
            return "SSL certificate verification failed{$codeSuffix}. Set CURL_CA_BUNDLE to a valid cacert.pem file in backend/.env and restart the backend.";
        }

        if (preg_match('/\bcURL error 28\b/i', $detail) === 1 || str_contains(strtolower($detail), 'timed out')) {
            return 'The AI service (' . $this->label() . ") timed out while responding{$codeSuffix}. Please try again.";
        }

        if ($e instanceof ConnectionException) {
            return 'Could not connect to the AI service (' . $this->label() . "){$codeSuffix}. Please check your internet/DNS connection and try again.";
        }

        return 'Could not reach the AI service (' . $this->label() . '). Please try again in a moment.';
    }
}
