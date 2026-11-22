<?php

namespace App\Services\Ai;

use RuntimeException;

class AiProviderException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly string $provider,
        public readonly int $httpStatus = 502,
        public readonly bool $quotaExhausted = false,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $httpStatus, $previous);
    }

    public static function looksLikeQuotaOrBillingError(int $status, string $errorBody): bool
    {
        if (in_array($status, [402, 429], true)) {
            return true;
        }

        $lower = strtolower($errorBody);
        foreach ([
            'quota',
            'rate limit',
            'ratelimit',
            'resource_exhausted',
            'resource exhausted',
            'insufficient_quota',
            'billing',
            'credit',
            'balance',
            'usage limit',
            'limit exceeded',
            'exceeded your current quota',
            'tier',
        ] as $needle) {
            if (str_contains($lower, $needle)) {
                return true;
            }
        }

        return false;
    }
}
