<?php

return [
    /*
    |--------------------------------------------------------------------------
    | API Request Telemetry Retention (Days)
    |--------------------------------------------------------------------------
    | Number of days to retain HTTP telemetry before pruning.
    */
    'retention_days' => env('TELEMETRY_RETENTION_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Excluded Paths
    |--------------------------------------------------------------------------
    | Endpoints excluded from telemetry recording to prevent noise.
    */
    'excluded_paths' => [
        'api/health',
        'api/test',
    ],

    /*
    |--------------------------------------------------------------------------
    | Slow Request Threshold (Milliseconds)
    |--------------------------------------------------------------------------
    */
    'slow_threshold_ms' => env('TELEMETRY_SLOW_THRESHOLD_MS', 500),
];
