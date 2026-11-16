<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NexumPayTransaction extends Model
{
    use HasFactory;

    protected $table = 'nexumpay_transactions';

    protected $fillable = [
        'reference_id',
        'client_ref',
        'internal_ref',
        'tenant_id',
        'user_id',
        'customer_name',
        'customer_email',
        'business_name',
        'phone_number',
        'msisdn',
        'network',
        'plan_id',
        'plan_name',
        'billing_cycle',
        'amount',
        'charge',
        'currency',
        'status',
        'narration',
        'transaction_date',
        'failure_reason',
        'raw_response',
        'webhook_payload',
    ];

    protected $casts = [
        'amount'           => 'float',
        'charge'           => 'float',
        'transaction_date' => 'datetime',
        'raw_response'     => 'array',
        'webhook_payload'  => 'array',
        'created_at'       => 'datetime',
        'updated_at'       => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isSuccessful(): bool
    {
        return in_array(strtoupper($this->status), ['SUCCESSFUL', 'SUCCESS'], true);
    }

    public function isPending(): bool
    {
        return strtoupper($this->status) === 'PENDING';
    }

    public function isFailed(): bool
    {
        return in_array(strtoupper($this->status), ['FAILED', 'FAIL', 'REJECTED', 'TIMEOUT', 'CANCELLED'], true);
    }
}

