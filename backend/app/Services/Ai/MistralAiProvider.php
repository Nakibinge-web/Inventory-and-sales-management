<?php

namespace App\Services\Ai;

class MistralAiProvider extends AbstractHttpAiProvider
{
    public function name(): string
    {
        return 'mistral';
    }

    public function label(): string
    {
        return (string) config('ai.providers.mistral.label', 'Mistral AI');
    }

    public function defaultModel(): string
    {
        return (string) (config('ai.providers.mistral.model') ?: 'open-mistral-7b');
    }

    private function apiKey(): ?string
    {
        $key = config('ai.providers.mistral.api_key') ?: config('services.mistral.key');
        $trimmed = trim((string) $key);

        return $trimmed !== '' ? $trimmed : null;
    }

    public function isConfigured(): bool
    {
        return $this->apiKey() !== null;
    }

    public function chat(string $systemPrompt, string $userPrompt): array
    {
        $apiKey = $this->apiKey();
        if (!$apiKey) {
            throw new AiProviderException(
                'Mistral API key is not configured. Please set MISTRAL_API_KEY in backend/.env.',
                $this->name(),
                503,
                true
            );
        }

        $endpoint = (string) config('ai.providers.mistral.endpoint', 'https://api.mistral.ai/v1/chat/completions');
        $fallbackModels = config('ai.providers.mistral.fallback_models', [
            'open-mistral-7b',
            'open-mistral-nemo',
            'mistral-tiny',
            'mistral-small-latest',
        ]);
        $candidateModels = array_values(array_unique(array_filter(array_merge(
            [$this->defaultModel()],
            is_array($fallbackModels) ? $fallbackModels : []
        ))));

        $lastError  = 'Unknown error';
        $lastStatus = 502;
        $lastRaw    = '';

        foreach ($candidateModels as $model) {
            $payload = [
                'model'    => $model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user',   'content' => $userPrompt],
                ],
                'temperature' => (float) config('ai.temperature', 0.4),
                'max_tokens'  => (int) config('ai.max_tokens', 1024),
            ];

            try {
                $response = $this->postJson(
                    $endpoint,
                    [
                        'Authorization' => 'Bearer ' . $apiKey,
                        'Content-Type'  => 'application/json',
                    ],
                    $payload
                );
            } catch (\Throwable $e) {
                $lastError  = $this->connectionErrorMessage($e);
                $lastStatus = 502;
                $lastRaw    = $e->getMessage();
                if ($this->isHostUnreachable($e)) {
                    break;
                }
                continue;
            }

            if ($response->successful()) {
                $text = (string) ($response->json('choices.0.message.content') ?? 'No response generated.');
                return [
                    'answer'         => $text,
                    'model'          => $model,
                    'provider'       => $this->name(),
                    'provider_label' => $this->label(),
                ];
            }

            $lastStatus = $response->status();
            $lastRaw    = (string) $response->body();
            $lastError  = (string) ($response->json('message')
                ?? $response->json('error.message')
                ?? 'Mistral API returned HTTP ' . $lastStatus);

            if (in_array($lastStatus, [404, 429, 503], true)) {
                continue;
            }

            break;
        }

        $quotaExhausted = AiProviderException::looksLikeQuotaOrBillingError($lastStatus, $lastError . ' ' . $lastRaw);

        throw new AiProviderException(
            $quotaExhausted
                ? 'Mistral AI usage limit or quota has been reached.'
                : "Mistral AI error: {$lastError}",
            $this->name(),
            ($lastStatus >= 400 && $lastStatus < 600) ? $lastStatus : 502,
            $quotaExhausted
        );
    }
}
