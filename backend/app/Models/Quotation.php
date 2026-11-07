<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\BelongsToTenant;

class Quotation extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'customer_id',
        'quotation_number',
        'quotation_date',
        'valid_until',
        'customer_name',
        'customer_phone',
        'customer_email',
        'customer_address',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'total_amount',
        'status',
        'items',
        'notes',
        'terms',
    ];

    protected $casts = [
        'quotation_date'  => 'date',
        'valid_until'     => 'date',
        'items'           => 'array',
        'subtotal'        => 'float',
        'discount_amount' => 'float',
        'tax_amount'      => 'float',
        'total_amount'    => 'float',
    ];

    protected $attributes = [
        'items'  => '[]',
        'status' => 'pending',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}

