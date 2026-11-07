<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class GeneratedReport extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'report_type',
        'title',
        'period_start',
        'period_end',
        'total_sales',
        'total_profit',
        'total_transactions',
        'source',
        'generated_at',
        'data',
    ];

    protected $casts = [
        'data'               => 'array',
        'generated_at'       => 'datetime',
        'period_start'       => 'date',
        'period_end'         => 'date',
        'total_sales'        => 'float',
        'total_profit'       => 'float',
        'total_transactions' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
