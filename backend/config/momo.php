<?php

return [
    /*
    |--------------------------------------------------------------------------
    | MTN MoMo API Environment
    |--------------------------------------------------------------------------
    | Supported: 'sandbox', 'production'
    */
    'environment' => env('MOMO_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Base API URL
    |--------------------------------------------------------------------------
    */
    'base_url' => env('MOMO_BASE_URL', 'https://sandbox.momodeveloper.mtn.com'),

    /*
    |--------------------------------------------------------------------------
    | Target Environment
    |--------------------------------------------------------------------------
    | Sandbox uses 'sandbox', production typically uses the live environment name
    */
    'target_environment' => env('MOMO_TARGET_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Currency
    |--------------------------------------------------------------------------
    | NOTE: MTN MoMo Sandbox exclusively accepts 'EUR'. In production, set this
    | to your local currency (e.g., 'UGX', 'GHS', 'RWF', 'ZMW').
    */
    'currency' => env('MOMO_CURRENCY', 'EUR'),

    /*
    |--------------------------------------------------------------------------
    | Credentials
    |--------------------------------------------------------------------------
    */
    'subscription_key' => env('MOMO_COLLECTION_SUBSCRIPTION_KEY', ''),
    'api_user_id'      => env('MOMO_API_USER_ID', ''),
    'api_key'          => env('MOMO_API_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Webhook / Callback URL
    |--------------------------------------------------------------------------
    */
    'callback_url'     => env('MOMO_CALLBACK_URL', null),
];
