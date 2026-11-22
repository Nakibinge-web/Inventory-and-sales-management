<?php

namespace App\Services\Ai;

use RuntimeException;

class PromptInjectionException extends RuntimeException
{
    public function __construct(
        string $message = 'Your request was blocked by the AI assistant security policy.',
        public readonly string $rule = 'prompt_injection'
    ) {
        parent::__construct($message, 422);
    }
}
