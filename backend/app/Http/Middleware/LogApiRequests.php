<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ApiRequestLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    /**
     * Paths excluded from request logging to prevent high-frequency noise.
     */
    private const EXCLUDED_PATHS = [
        'api/health',
        'api/test',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $correlationId = $request->header('X-Correlation-ID', Str::uuid()->toString());

        try {
            $response = $next($request);
            $this->captureTelemetry($request, $response, $startTime, $correlationId);
            return $response;
        } catch (\Throwable $e) {
            $this->captureExceptionTelemetry($request, $e, $startTime, $correlationId);
            throw $e;
        }
    }

    /**
     * Safely persist telemetry data without disrupting normal responses.
     */
    protected function captureTelemetry(Request $request, Response $response, float $startTime, string $correlationId): void
    {
        try {
            $path = trim($request->path(), '/');

            $excludedPaths = config('telemetry.excluded_paths', self::EXCLUDED_PATHS);
            foreach ($excludedPaths as $excluded) {
                if ($path === $excluded || str_starts_with($path, $excluded . '/')) {
                    return;
                }
            }

            $durationMs = round((microtime(true) - $startTime) * 1000, 2);
            $statusCode = $response->getStatusCode();

            $user = Auth::user();
            $userId = $user?->id;
            $tenantId = app()->has('current_tenant') ? app('current_tenant')->id : ($user?->tenant_id);

            // Normalized route or endpoint
            $routeName = $request->route()?->getName();
            $endpoint = '/' . $path;

            // Classify errors safely without exposing full stack traces
            $errorType = null;
            $errorMessage = null;

            if ($statusCode >= 400) {
                $errorType = $statusCode >= 500 ? 'ServerError' : 'ClientError';

                // Try to extract sanitized message from JSON response
                $content = $response->getContent();
                if ($content) {
                    $decoded = json_decode($content, true);
                    if (is_array($decoded) && isset($decoded['message'])) {
                        $errorMessage = $this->sanitizeErrorMessage((string) $decoded['message']);
                    }
                }
            }

            ApiRequestLog::create([
                'correlation_id' => substr($correlationId, 0, 64),
                'method'         => strtoupper(substr($request->method(), 0, 10)),
                'endpoint'       => substr($endpoint, 0, 255),
                'route_name'     => $routeName ? substr($routeName, 0, 100) : null,
                'status_code'    => $statusCode,
                'duration_ms'    => $durationMs,
                'ip_address'     => substr((string) $request->ip(), 0, 45),
                'user_agent'     => substr((string) $request->userAgent(), 0, 255),
                'user_id'        => $userId,
                'tenant_id'      => $tenantId,
                'error_type'     => $errorType,
                'error_message'  => $errorMessage,
                'created_at'     => now(),
            ]);
        } catch (\Throwable $e) {
            // Telemetry must never crash application requests
            \Illuminate\Support\Facades\Log::warning('LogApiRequests failure: ' . $e->getMessage());
        }
    }

    /**
     * Capture unhandled exceptions that propagate up through middleware.
     */
    protected function captureExceptionTelemetry(Request $request, \Throwable $e, float $startTime, string $correlationId): void
    {
        try {
            $path = trim($request->path(), '/');

            $excludedPaths = config('telemetry.excluded_paths', self::EXCLUDED_PATHS);
            foreach ($excludedPaths as $excluded) {
                if ($path === $excluded || str_starts_with($path, $excluded . '/')) {
                    return;
                }
            }

            $durationMs = round((microtime(true) - $startTime) * 1000, 2);
            $statusCode = 500;

            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                $statusCode = 401;
            } elseif ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface) {
                $statusCode = $e->getStatusCode();
            } elseif ($e instanceof \Illuminate\Validation\ValidationException) {
                $statusCode = 422;
            }

            $user = Auth::user();
            $userId = $user?->id;
            $tenantId = app()->has('current_tenant') ? app('current_tenant')->id : ($user?->tenant_id);

            ApiRequestLog::create([
                'correlation_id' => substr($correlationId, 0, 64),
                'method'         => strtoupper(substr($request->method(), 0, 10)),
                'endpoint'       => '/' . substr($path, 0, 254),
                'route_name'     => $request->route()?->getName() ? substr($request->route()->getName(), 0, 100) : null,
                'status_code'    => $statusCode,
                'duration_ms'    => $durationMs,
                'ip_address'     => substr((string) $request->ip(), 0, 45),
                'user_agent'     => substr((string) $request->userAgent(), 0, 255),
                'user_id'        => $userId,
                'tenant_id'      => $tenantId,
                'error_type'     => class_basename($e),
                'error_message'  => $this->sanitizeErrorMessage($e->getMessage() ?: 'Unauthenticated.'),
                'created_at'     => now(),
            ]);
        } catch (\Throwable $loggingError) {
            \Illuminate\Support\Facades\Log::warning('captureExceptionTelemetry failure: ' . $loggingError->getMessage());
        }
    }

    /**
     * Sanitize error message to prevent accidental leakage of secrets, tokens, or credentials.
     */
    protected function sanitizeErrorMessage(?string $message): ?string
    {
        if ($message === null) {
            return null;
        }

        // Redact Bearer tokens
        $sanitized = preg_replace('/Bearer\s+[A-Za-z0-9\-._~+\/]+=*/i', 'Bearer [REDACTED]', $message);

        // Redact key-value secrets in query/error strings (e.g. password=..., token=..., secret=...)
        $patterns = [
            '/(password|secret|token|api[_-]?key|auth(?:orization)?|cookie|card|cvv|pin|access[_-]?token|refresh[_-]?token)\s*([:=]|=>)\s*([^\s,;\'"\]\}]+)/i',
            '/(["\'](?:password|secret|token|api[_-]?key|access[_-]?token|refresh[_-]?token)["\']\s*:\s*["\'])([^"\']+)(["\'])/i',
        ];

        $sanitized = preg_replace($patterns[0], '$1$2[REDACTED]', $sanitized);
        $sanitized = preg_replace($patterns[1], '$1[REDACTED]$3', $sanitized);

        // Redact database credentials in connection strings
        $sanitized = preg_replace('/(mysql|postgres|sqlite|redis):\/\/[^@]+@/i', '$1://[REDACTED]@', $sanitized);

        return Str::limit($sanitized, 500);
    }
}
