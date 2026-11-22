<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Active AI Provider
    |--------------------------------------------------------------------------
    |
    | Supported providers: "mistral", "gemini".
    | Switch providers via AI_PROVIDER in .env without modifying application code.
    |
    */
    'provider' => env('AI_PROVIDER', 'mistral'),

    /*
    |--------------------------------------------------------------------------
    | Automatic Failover
    |--------------------------------------------------------------------------
    |
    | When enabled, if the active provider exhausts its quota, credits, or rate
    | limit (or lacks a configured key), AiManager automatically fails over to
    | the fallback provider so the assistant keeps working uninterrupted.
    |
    */
    'auto_fallback' => filter_var(env('AI_AUTO_FALLBACK', true), FILTER_VALIDATE_BOOLEAN),
    'fallback_provider' => env('AI_FALLBACK_PROVIDER', 'gemini'),

    'temperature'     => (float) env('AI_TEMPERATURE', 0.4),
    'max_tokens'      => (int) env('AI_MAX_TOKENS', 2048),
    'connect_timeout' => (int) env('AI_CONNECT_TIMEOUT', 10),
    'timeout'         => (int) env('AI_TIMEOUT', 25),
    'ca_bundle'       => env('CURL_CA_BUNDLE'),

    'providers' => [
        'mistral' => [
            'label'    => 'Mistral AI',
            'api_key'  => env('MISTRAL_API_KEY'),
            'model'    => env('MISTRAL_MODEL', 'open-mistral-7b'),
            'endpoint' => env('MISTRAL_ENDPOINT', 'https://api.mistral.ai/v1/chat/completions'),
            'fallback_models' => [
                'open-mistral-7b',
                'open-mistral-nemo',
                'mistral-tiny',
                'mistral-small-latest',
            ],
        ],

        'gemini' => [
            'label'    => 'Google Gemini',
            'api_key'  => env('GEMINI_API_KEY'),
            'model'    => env('GEMINI_MODEL', 'gemini-3-flash-preview'),
            'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/models'),
            'fallback_models' => [
                'gemini-3-flash-preview',
                'gemini-flash-lite-latest',
                'gemini-3.5-flash-lite',
                'gemini-3.1-flash-lite',
                'gemini-3.8-flash',
                'gemini-flash-latest',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Prompt-Injection & .ignore Policy
    |--------------------------------------------------------------------------
    */
    'security' => [
        'block_injections' => filter_var(env('AI_BLOCK_PROMPT_INJECTION', true), FILTER_VALIDATE_BOOLEAN),
        'ignore_files' => [
            base_path('.aiignore'),
            base_path('../.agentignore'),
            base_path('../.aiignore'),
        ],
    ],

];
