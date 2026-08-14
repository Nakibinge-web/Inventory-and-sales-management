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
        'is_enabled',
        'delivery_method',
        'recipient_email',
        'last_sent_at',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'last_sent_at' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
