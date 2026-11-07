<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nexumpay_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('reference_id')->unique();
            $table->string('client_ref')->unique()->index(); // Sent as 'reference' / 'client_ref' to NexumPay
            $table->string('internal_ref')->nullable()->index(); // Returned by NexumPay details.internal_ref

            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Subscriber & Business Details
            $table->string('customer_name');
            $table->string('customer_email')->index();
            $table->string('business_name')->nullable();
            $table->string('phone_number', 30); // Local format e.g. 0771234567
            $table->string('msisdn', 30)->nullable(); // International format e.g. 256771234567
            $table->string('network', 40)->nullable(); // MTN Mobile Money / Airtel Money

            // Subscription Plan Details
            $table->string('plan_id', 50); // starter, business
            $table->string('plan_name', 100);
            $table->string('billing_cycle', 30)->default('monthly'); // monthly, annual
            $table->decimal('amount', 14, 2);
            $table->decimal('charge', 14, 2)->default(0.00); // NexumPay gateway charge (details.charge)
            $table->string('currency', 5)->default('UGX');

            // Transaction Lifecycle Status: PENDING, SUCCESSFUL, FAILED
            $table->string('status', 30)->default('PENDING')->index();
            $table->string('narration')->nullable();
            $table->timestamp('transaction_date')->nullable();
            $table->text('failure_reason')->nullable();

            // Audit & Webhook Payloads
            $table->json('raw_response')->nullable();
            $table->json('webhook_payload')->nullable();

            $table->timestamps();
        });

        // Ensure subscription columns exist on tenants table
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
        Schema::dropIfExists('nexumpay_transactions');
    }
};

