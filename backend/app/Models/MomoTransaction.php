<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MomoTransaction extends Model
{
    use HasFactory;

    protected $table = 'momo_transactions';

    protected $fillable = [
        'reference_id',
        'external_id',
        'tenant_id',
        'user_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'plan_id',
        'plan_name',
        'billing_cycle',
        'amount',
        'currency',
        'momo_amount',
        'momo_currency',
        'status',
        'financial_transaction_id',
        'payer_message',
        'payee_note',
        'failure_reason',
        'raw_response',
        'webhook_payload',
    ];

    protected $casts = [
        'amount'          => 'float',
        'momo_amount'     => 'float',
        'raw_response'    => 'array',
        'webhook_payload' => 'array',
        'created_at'      => 'datetime',
        'updated_at'      => 'datetime',
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
        return strtoupper($this->status) === 'SUCCESSFUL';
    }

    public function isPending(): bool
    {
        return strtoupper($this->status) === 'PENDING';
    }

    public function isFailed(): bool
    {
        return in_array(strtoupper($this->status), ['FAILED', 'REJECTED', 'TIMEOUT']);
    }
}
