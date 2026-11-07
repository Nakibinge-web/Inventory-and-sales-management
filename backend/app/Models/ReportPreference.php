<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class ReportPreference extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'report_type',
        'frequency',
        'time_of_day',
        'day_of_week',
        'day_of_month',
        'interval_minutes',
        'is_enabled',
        'delivery_method',
        'recipient_email',
        'last_sent_at',
        'next_run_at',
    ];

    protected $casts = [
        'is_enabled'       => 'boolean',
        'last_sent_at'     => 'datetime',
        'next_run_at'      => 'datetime',
        'day_of_month'     => 'integer',
        'interval_minutes' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
