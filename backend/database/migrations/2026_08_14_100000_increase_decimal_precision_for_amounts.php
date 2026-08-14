<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Increase precision for sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('total_amount', 15, 2)->change();
            $table->decimal('discount_amount', 15, 2)->nullable()->change();
            $table->decimal('tax_amount', 15, 2)->nullable()->change();
        });

        // Increase precision for purchases table
        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('total_amount', 15, 2)->change();
        });

        // Increase precision for sale_items table
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('price', 15, 2)->change();
            $table->decimal('subtotal', 15, 2)->change();
        });

        // Increase precision for purchase_items table (only has cost_price, no subtotal)
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 2)->change();
        });

        // Increase precision for products table
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 2)->nullable()->change();
            $table->decimal('price', 15, 2)->change();
        });

        // Increase precision for invoices table
        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('subtotal', 15, 2)->nullable()->change();
            $table->decimal('discount_amount', 15, 2)->nullable()->change();
            $table->decimal('tax_amount', 15, 2)->nullable()->change();
            $table->decimal('total_amount', 15, 2)->change();
            $table->decimal('amount_paid', 15, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original precision (10, 2)
        Schema::table('sales', function (Blueprint $table) {
            $table->decimal('total_amount', 10, 2)->change();
            $table->decimal('discount_amount', 10, 2)->nullable()->change();
            $table->decimal('tax_amount', 10, 2)->nullable()->change();
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->decimal('total_amount', 10, 2)->change();
        });

        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->change();
            $table->decimal('subtotal', 10, 2)->change();
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('cost_price', 10, 2)->change();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->decimal('cost_price', 10, 2)->nullable()->change();
            $table->decimal('price', 10, 2)->change();
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->decimal('subtotal', 10, 2)->nullable()->change();
            $table->decimal('discount_amount', 10, 2)->nullable()->change();
            $table->decimal('tax_amount', 10, 2)->nullable()->change();
            $table->decimal('total_amount', 10, 2)->change();
            $table->decimal('amount_paid', 10, 2)->default(0)->change();
        });
    }
};
