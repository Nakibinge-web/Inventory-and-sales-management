<?php

return [
    /*
    |--------------------------------------------------------------------------
    | NexumPay API Base URL
    |--------------------------------------------------------------------------
    | Official NexumPay (Araknerd) API endpoint: https://nexumpayapi.araknerd.com
    */
    'base_url' => env('NEXUMPAY_BASE_URL', 'https://nexumpayapi.araknerd.com'),

    /*
    |--------------------------------------------------------------------------
    | Business Wallet Address
    |--------------------------------------------------------------------------
    | Your NexumPay Business Wallet Address (e.g. B-A2E9-5AA5-4202)
    */
    'wallet_address' => env('NEXUMPAY_WALLET_ADDRESS', ''),

    /*
    |--------------------------------------------------------------------------
    | App-Generated Secret (Auth Token)
    |--------------------------------------------------------------------------
    | Generated inside the NexumPay App -> API Access -> Generate Secret.
    | Used to generate short-lived (120s) API keys via /platform/api/generate_api_key.
    */
    'auth_token' => env('NEXUMPAY_AUTH_TOKEN', ''),

    /*
    |--------------------------------------------------------------------------
    | Optional Credentials for Programmatic Auth Token Generation
    |--------------------------------------------------------------------------
    | Used via /platform/api/generate_auth_token if NEXUMPAY_AUTH_TOKEN is not set.
    */
    'username' => env('NEXUMPAY_USERNAME', ''),
    'password' => env('NEXUMPAY_PASSWORD', ''),

    /*
    |--------------------------------------------------------------------------
    | Webhook / Callback URL
    |--------------------------------------------------------------------------
    | Public endpoint where NexumPay posts asynchronous collection updates.
    */
    'callback_url' => env('NEXUMPAY_CALLBACK_URL', null),

    /*
    |--------------------------------------------------------------------------
    | Simulation / Sandbox Fallback
    |--------------------------------------------------------------------------
    | When true and live credentials are not yet configured in .env, allows
    | testing the checkout flow and simulating USSD PIN approval locally.
    */
    'simulation_mode' => env('NEXUMPAY_SIMULATION_MODE', false),
];

