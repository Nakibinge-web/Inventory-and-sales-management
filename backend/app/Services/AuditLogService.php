<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuditLogService
{
    private const REDACTED_KEYS = [
        'password',
        'password_confirmation',
        'token',
        'secret',
        'authorization',
        'api_key',
        'cookie',
        'remember_token',
        'credit_card',
        'access_token',
        'refresh_token',
        'session',
        'cvv',
        'pin',
        'private_key',
    ];

    /**
     * Record an append-only audit activity log.
     */
    public static function log(string $event, string $description, array $options = []): ?ActivityLog
    {
        try {
            $user = Auth::user();
            $actorId = $options['actor_id'] ?? ($user ? $user->id : null);

            $tenantId = $options['tenant_id'] ?? null;
            if ($tenantId === null && app()->has('current_tenant')) {
                $tenantId = app('current_tenant')->id;
            } elseif ($tenantId === null && $user && isset($user->tenant_id)) {
                $tenantId = $user->tenant_id;
            }

            $properties = isset($options['properties']) && is_array($options['properties'])
                ? self::redactSensitiveData($options['properties'])
                : null;

            $correlationId = $options['correlation_id'] ?? request()?->header('X-Correlation-ID', Str::uuid()->toString());
            $ipAddress = $options['ip_address'] ?? request()?->ip();

            return ActivityLog::create([
                'correlation_id' => substr((string) $correlationId, 0, 64),
                'actor_id'       => $actorId,
                'tenant_id'      => $tenantId,
                'event'          => $event,
                'description'    => $description,
                'severity'       => $options['severity'] ?? 'info',
                'target_type'    => $options['target_type'] ?? null,
                'target_id'      => isset($options['target_id']) ? (string) $options['target_id'] : null,
                'outcome'        => $options['outcome'] ?? 'success',
                'properties'     => $properties,
                'ip_address'     => $ipAddress ? substr($ipAddress, 0, 45) : null,
                'created_at'     => now(),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to write activity log: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Recursively redact sensitive keys from log properties.
     */
    public static function redactSensitiveData(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $lowerKey = strtolower((string) $key);

            $shouldRedact = false;
            foreach (self::REDACTED_KEYS as $sensitive) {
                if (str_contains($lowerKey, $sensitive)) {
                    $shouldRedact = true;
                    break;
                }
            }

            if ($shouldRedact) {
                $sanitized[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::redactSensitiveData($value);
            } elseif (is_string($value)) {
                $sanitized[$key] = preg_replace('/Bearer\s+[A-Za-z0-9\-._~+\/]+=*/i', 'Bearer [REDACTED]', $value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
