<?php

namespace App\Services\Ai;

class GeminiAiProvider extends AbstractHttpAiProvider
{
    public function name(): string
    {
        return 'gemini';
    }

    public function label(): string
    {
        return (string) config('ai.providers.gemini.label', 'Google Gemini');
    }

    public function defaultModel(): string
    {
        return (string) (config('ai.providers.gemini.model') ?: 'gemini-3-flash-preview');
    }

    private function apiKey(): ?string
    {
        $key = config('ai.providers.gemini.api_key') ?: config('services.gemini.key');
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
                'Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.',
                $this->name(),
                503,
                true
            );
        }

        $baseUrl = rtrim(
            (string) config('ai.providers.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta/models'),
            '/'
        );
        $fallbackModels = config('ai.providers.gemini.fallback_models', [
            'gemini-3-flash-preview',
            'gemini-flash-lite-latest',
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3.8-flash',
            'gemini-flash-latest',
        ]);
        $candidateModels = array_values(array_unique(array_filter(array_merge(
            [$this->defaultModel()],
            is_array($fallbackModels) ? $fallbackModels : []
        ))));

        $lastError  = 'Unknown error';
        $lastStatus = 502;
        $lastRaw    = '';

        foreach ($candidateModels as $model) {
            $endpoint = "{$baseUrl}/{$model}:generateContent";

            $payload = [
                'systemInstruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => [
                    [
                        'role'  => 'user',
                        'parts' => [['text' => $userPrompt]],
                    ],
                ],
                'generationConfig' => [
                    'temperature'     => (float) config('ai.temperature', 0.4),
                    'maxOutputTokens' => (int) config('ai.max_tokens', 2048),
                ],
            ];

            try {
                $response = $this->postJson(
                    $endpoint,
                    [
                        'x-goog-api-key' => $apiKey,
                        'Content-Type'   => 'application/json',
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
                $parts = $response->json('candidates.0.content.parts', []);
                $chunks = [];
                if (is_array($parts)) {
                    foreach ($parts as $part) {
                        if (!is_array($part) || !empty($part['thought'])) {
                            continue;
                        }
                        if (isset($part['text'])) {
                            $chunks[] = (string) $part['text'];
                        }
                    }
                }
                $text = trim(implode("\n", $chunks));
                if ($text === '') {
                    $lastStatus = 502;
                    $lastError = "Gemini model {$model} returned an empty response.";
                    continue;
                }

                return [
                    'answer'         => $text,
                    'model'          => $model,
                    'provider'       => $this->name(),
                    'provider_label' => $this->label(),
                ];
            }

            $lastStatus = $response->status();
            $lastRaw    = (string) $response->body();
            $lastError  = (string) ($response->json('error.message')
                ?? $response->json('message')
                ?? 'Gemini API returned HTTP ' . $lastStatus);

            // Try the next model on deprecated/not-found (404), rate limit (429), or temporary model load spike (503)
            if (in_array($lastStatus, [404, 429, 503], true)) {
                continue;
            }

            break;
        }

        $quotaExhausted = AiProviderException::looksLikeQuotaOrBillingError($lastStatus, $lastError . ' ' . $lastRaw);

        throw new AiProviderException(
            $quotaExhausted
                ? 'Google Gemini usage limit or quota has been reached.'
                : "Google Gemini error: {$lastError}",
            $this->name(),
            ($lastStatus >= 400 && $lastStatus < 600) ? $lastStatus : 502,
            $quotaExhausted
        );
    }
}
