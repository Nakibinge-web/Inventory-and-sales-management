<?php

namespace App\Services\Ai;

interface AiProviderInterface
{
    public function name(): string;

    public function label(): string;

    public function defaultModel(): string;

    public function isConfigured(): bool;

    /**
     * Send system instructions + user prompt to the LLM provider.
     *
     * @return array{answer: string, model: string, provider: string, provider_label: string}
     *
     * @throws AiProviderException
     */
    public function chat(string $systemPrompt, string $userPrompt): array;
}
