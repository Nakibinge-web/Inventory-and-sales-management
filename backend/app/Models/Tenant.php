<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'contacts',
        'address',
        'logo_path',
        'signature_path',
        'tagline',
        'tin',
        'website',
        'bank_name',
        'account_name',
        'account_number',
        'mobile_money_number',
        'mobile_money_name',
        'payment_terms',
        'invoice_notes',
        'enabled_modules',
    ];

    public const DEFAULT_MODULES = [
        'pos' => true,
        'products' => true,
        'categories' => true,
        'suppliers' => true,
        'customers' => true,
        'sales' => true,
        'invoices' => true,
        'purchases' => true,
        'stock-movements' => true,
        'reports' => true,
        'ai' => true,
    ];

    protected $casts = [
        'contacts' => 'array',
        'enabled_modules' => 'array',
    ];

    protected $appends = [
        'logo_url',
        'signature_url',
    ];

    public function getEnabledModulesAttribute($value)
    {
        if (empty($value)) {
            return self::DEFAULT_MODULES;
        }

        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            return self::DEFAULT_MODULES;
        }

        return array_merge(self::DEFAULT_MODULES, $decoded);
    }

    public function getLogoUrlAttribute(): ?string
    {
        if (!$this->logo_path) {
            return null;
        }

        if (filter_var($this->logo_path, FILTER_VALIDATE_URL) || str_starts_with($this->logo_path, 'data:image/')) {
            return $this->logo_path;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->logo_path);
    }

    public function getSignatureUrlAttribute(): ?string
    {
        if (!$this->signature_path) {
            return null;
        }

        if (filter_var($this->signature_path, FILTER_VALIDATE_URL) || str_starts_with($this->signature_path, 'data:image/')) {
            return $this->signature_path;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->signature_path);
    }

    // Relationships
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }
}
