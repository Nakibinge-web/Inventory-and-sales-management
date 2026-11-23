<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ApiRequestLog extends Model
{
    protected $table = 'api_requests_log';

    public $timestamps = false;

    protected $fillable = [
        'correlation_id',
        'method',
        'endpoint',
        'route_name',
        'status_code',
        'duration_ms',
        'ip_address',
        'user_agent',
        'user_id',
        'tenant_id',
        'error_type',
        'error_message',
        'created_at',
    ];

    protected $casts = [
        'status_code' => 'integer',
        'duration_ms' => 'float',
        'created_at'  => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withoutGlobalScopes();
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function scopeErrors(Builder $query): Builder
    {
        return $query->where('status_code', '>=', 400);
    }

    public function scopeSlow(Builder $query, float $thresholdMs = 500): Builder
    {
        return $query->where('duration_ms', '>=', $thresholdMs);
    }

    public function scopeForTenant(Builder $query, int $tenantId): Builder
    {
        return $query->where('tenant_id', $tenantId);
    }
}
