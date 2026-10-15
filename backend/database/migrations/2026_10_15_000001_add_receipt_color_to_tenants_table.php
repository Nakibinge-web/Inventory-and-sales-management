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
        if (!Schema::hasColumn('tenants', 'receipt_color')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('receipt_color', 30)->default('rose')->after('address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('tenants', 'receipt_color')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->dropColumn('receipt_color');
            });
        }
    }
};
