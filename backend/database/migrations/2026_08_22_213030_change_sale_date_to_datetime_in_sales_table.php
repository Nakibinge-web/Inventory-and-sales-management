<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change sale_date from date to datetime to include time information
        Schema::table('sales', function (Blueprint $table) {
            $table->dateTime('sale_date')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to date type if needed
        Schema::table('sales', function (Blueprint $table) {
            $table->date('sale_date')->change();
        });
    }
};
