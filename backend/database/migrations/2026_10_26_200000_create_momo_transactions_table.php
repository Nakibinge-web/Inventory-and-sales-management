<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('momo_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('reference_id')->unique();
            $table->string('external_id')->index();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Customer Info
            $table->string('customer_name');
            $table->string('customer_email');
            $table->string('customer_phone');
            
            // Plan Details
            $table->string('plan_id'); // e.g. starter, business
            $table->string('plan_name'); // e.g. Starter, Business
            $table->string('billing_cycle')->default('monthly'); // monthly, annual
            $table->decimal('amount', 14, 2);
            $table->string('currency', 5)->default('UGX');
            $table->decimal('momo_amount', 14, 2)->nullable();
            $table->string('momo_currency', 5)->nullable();
            
            // Status: PENDING, SUCCESSFUL, FAILED, REJECTED, TIMEOUT
            $table->string('status', 30)->default('PENDING')->index();
            $table->string('financial_transaction_id')->nullable()->index();
            
            // Messages
            $table->string('payer_message')->nullable();
            $table->string('payee_note')->nullable();
            $table->text('failure_reason')->nullable();
            
            // Payloads for debugging and auditing
            $table->json('raw_response')->nullable();
            $table->json('webhook_payload')->nullable();
            
            $table->timestamps();
        });

        // Add subscription columns to tenants table if not already present
        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                if (!Schema::hasColumn('tenants', 'subscription_plan')) {
                    $table->string('subscription_plan', 50)->nullable()->after('address');
                }
                if (!Schema::hasColumn('tenants', 'subscription_status')) {
                    $table->string('subscription_status', 30)->default('inactive')->after('subscription_plan');
                }
                if (!Schema::hasColumn('tenants', 'subscription_expires_at')) {
                    $table->timestamp('subscription_expires_at')->nullable()->after('subscription_status');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('momo_transactions');

        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('tenants', 'subscription_plan')) $columns[] = 'subscription_plan';
                if (Schema::hasColumn('tenants', 'subscription_status')) $columns[] = 'subscription_status';
                if (Schema::hasColumn('tenants', 'subscription_expires_at')) $columns[] = 'subscription_expires_at';
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
