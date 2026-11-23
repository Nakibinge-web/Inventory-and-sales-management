<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->string('correlation_id', 64)->nullable()->index();
                $table->unsignedBigInteger('actor_id')->nullable()->index();
                $table->unsignedBigInteger('tenant_id')->nullable()->index();
                $table->string('event', 100)->index();
                $table->text('description');
                $table->string('severity', 20)->default('info')->index(); // info, warning, error, critical
                $table->string('target_type', 100)->nullable()->index();
                $table->string('target_id', 50)->nullable()->index();
                $table->string('outcome', 20)->default('success'); // success, failure
                $table->json('properties')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamp('created_at')->index();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
