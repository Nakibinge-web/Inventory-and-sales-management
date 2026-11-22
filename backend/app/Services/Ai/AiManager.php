<?php

namespace App\Services\Ai;

use App\Models\Tenant;
use App\Models\User;

class AiManager
{
    public const SUPPORTED_PROVIDERS = ['mistral', 'gemini'];

    /**
     * @var array<string, AiProviderInterface>
     */
    private array $providers;

    public function __construct(
        MistralAiProvider $mistral,
        GeminiAiProvider $gemini,
        private BusinessContextBuilder $contextBuilder,
        private PromptSecurityService $security
    ) {
        $this->providers = [
            'mistral' => $mistral,
            'gemini'  => $gemini,
        ];
    }

    public function resolvePrimaryName(?Tenant $tenant = null): string
    {
        $tenantOverride = $tenant?->ai_provider;
        if (is_string($tenantOverride) && in_array(strtolower($tenantOverride), self::SUPPORTED_PROVIDERS, true)) {
            return strtolower($tenantOverride);
        }

        $configured = strtolower((string) config('ai.provider', 'mistral'));

        return in_array($configured, self::SUPPORTED_PROVIDERS, true) ? $configured : 'mistral';
    }

    public function resolveFallbackName(string $primaryName): ?string
    {
        if (!config('ai.auto_fallback', true)) {
            return null;
        }

        $configuredFallback = strtolower((string) config('ai.fallback_provider', ''));

        if ($configuredFallback === 'none' || $configuredFallback === 'null') {
            return null;
        }

        if (in_array($configuredFallback, self::SUPPORTED_PROVIDERS, true) && $configuredFallback !== $primaryName) {
            return $configuredFallback;
        }

        // Smart default: if fallback matches primary (e.g. AI_PROVIDER switched to gemini without editing AI_FALLBACK_PROVIDER),
        // automatically pair with the other provider.
        foreach (self::SUPPORTED_PROVIDERS as $candidate) {
            if ($candidate !== $primaryName) {
                return $candidate;
            }
        }

        return null;
    }

    public function getStatus(?Tenant $tenant = null): array
    {
        $primary = $this->resolvePrimaryName($tenant);
        $fallback = $this->resolveFallbackName($primary);
        $envDefault = strtolower((string) config('ai.provider', 'mistral'));

        $providerStatuses = [];
        foreach ($this->providers as $key => $driver) {
            $providerStatuses[$key] = [
                'name'       => $key,
                'label'      => $driver->label(),
                'model'      => $driver->defaultModel(),
                'configured' => $driver->isConfigured(),
            ];
        }

        return [
            'active_provider'   => $primary,
            'active_label'      => $this->providers[$primary]->label(),
            'tenant_override'   => $tenant?->ai_provider ?: null,
            'env_default'       => in_array($envDefault, self::SUPPORTED_PROVIDERS, true) ? $envDefault : 'mistral',
            'auto_fallback'     => (bool) config('ai.auto_fallback', true),
            'fallback_provider' => $fallback,
            'providers'         => $providerStatuses,
        ];
    }

    /**
     * Execute an AI chat completion with prompt-injection defense and seamless provider switching / failover.
     *
     * @return array{answer: string, provider: string, provider_label: string, model: string, failover_used: bool, primary_provider: string}
     *
     * @throws PromptInjectionException
     * @throws AiProviderException
     */
    public function chat(User $user, string $question): array
    {
        // 1. Validate question against prompt injection & .ignore policy before touching any API
        $this->security->inspectUserQuestion($question);

        // 2. Build sanitized tenant-isolated context & isolate instructions from data
        $tenant  = $user->tenant;
        $context = $this->contextBuilder->buildForTenant($user->tenant_id);
        $prompts = $this->security->buildIsolatedPrompts($context, $question);

        $primaryName  = $this->resolvePrimaryName($tenant);
        $fallbackName = $this->resolveFallbackName($primaryName);

        $orderedNames = array_values(array_unique(array_filter([$primaryName, $fallbackName])));

        $configuredDrivers = array_values(array_filter(
            $orderedNames,
            fn(string $name) => isset($this->providers[$name]) && $this->providers[$name]->isConfigured()
        ));

        if (count($configuredDrivers) === 0) {
            throw new AiProviderException(
                'AI service is not configured. Please set MISTRAL_API_KEY or GEMINI_API_KEY in your .env file.',
                $primaryName,
                503,
                false
            );
        }

        $attempts = [];

        foreach ($configuredDrivers as $driverName) {
            $driver = $this->providers[$driverName];

            try {
                $result = $driver->chat($prompts['system_prompt'], $prompts['user_prompt']);
                $result['answer']           = $this->security->redactOutput($result['answer']);
                $result['failover_used']    = ($driverName !== $primaryName);
                $result['primary_provider'] = $primaryName;

                return $result;
            } catch (AiProviderException $e) {
                $attempts[] = $e;
                // Fail over to the backup configured provider if enabled
                continue;
            }
        }

        if (count($attempts) === 1) {
            throw $attempts[0];
        }

        $first = $attempts[0];
        $combinedMsg = implode(' | ', array_map(fn(AiProviderException $e) => $e->getMessage(), $attempts));
        throw new AiProviderException(
            $combinedMsg,
            $first->provider,
            $first->httpStatus,
            collect($attempts)->every(fn(AiProviderException $e) => $e->quotaExhausted)
        );
    }
}
