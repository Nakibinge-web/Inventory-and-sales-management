<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'contact',
        'email',
        'address',
    ];

    // Relationships
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
