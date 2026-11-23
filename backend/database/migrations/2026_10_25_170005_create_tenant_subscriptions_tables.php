<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tenant_subscriptions')) {
            Schema::create('tenant_subscriptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->unique()->constrained()->onDelete('cascade');
                $table->string('plan_name', 50)->default('Trial');
                $table->string('status', 30)->default('trialing')->index(); // trialing, active, past_due, expired, canceled
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('expires_at')->nullable()->index();
                $table->unsignedInteger('max_users')->default(5);
                $table->unsignedInteger('max_products')->default(500);
                $table->decimal('price', 15, 2)->default(0);
                $table->string('currency', 10)->default('UGX');
                $table->string('billing_cycle', 20)->default('monthly'); // monthly, yearly
                $table->boolean('is_complimentary')->default(false);
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('subscription_history')) {
            Schema::create('subscription_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->unsignedBigInteger('actor_id')->nullable()->index();
                $table->string('event_type', 50)->index(); // created, trial_extended, plan_changed, status_changed
                $table->string('from_plan', 50)->nullable();
                $table->string('to_plan', 50)->nullable();
                $table->string('from_status', 30)->nullable();
                $table->string('to_status', 30)->nullable();
                $table->string('reason', 255)->nullable();
                $table->json('properties')->nullable();
                $table->timestamp('created_at')->index();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_history');
        Schema::dropIfExists('tenant_subscriptions');
    }
};
