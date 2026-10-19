<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('signature_path')->nullable()->after('logo_path');
            $table->string('tagline')->nullable()->after('signature_path');
            $table->string('tin')->nullable()->after('tagline');
            $table->string('website')->nullable()->after('tin');
            $table->string('bank_name')->nullable()->after('website');
            $table->string('account_name')->nullable()->after('bank_name');
            $table->string('account_number')->nullable()->after('account_name');
            $table->string('mobile_money_number')->nullable()->after('account_number');
            $table->string('mobile_money_name')->nullable()->after('mobile_money_number');
            $table->string('payment_terms')->nullable()->after('mobile_money_name');
            $table->text('invoice_notes')->nullable()->after('payment_terms');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
