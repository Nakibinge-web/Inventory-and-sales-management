<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a nullable historical cost_price snapshot column to sale_items.
     * Existing rows are intentionally left NULL (never backfilled with today's
     * product cost) so analytics can distinguish recorded cost snapshots from
     * historical estimates.
     */
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 2)->nullable()->after('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn('cost_price');
        });
    }
};
