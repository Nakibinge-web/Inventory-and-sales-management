<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('api_requests_log')) {
            Schema::create('api_requests_log', function (Blueprint $table) {
                $table->id();
                $table->string('correlation_id', 64)->nullable()->index();
                $table->string('method', 10);
                $table->string('endpoint', 255)->index();
                $table->string('route_name', 100)->nullable()->index();
                $table->unsignedSmallInteger('status_code')->index();
                $table->float('duration_ms')->index();
                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent', 255)->nullable();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->unsignedBigInteger('tenant_id')->nullable()->index();
                $table->string('error_type', 150)->nullable()->index();
                $table->text('error_message')->nullable();
                $table->timestamp('created_at')->index();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('api_requests_log');
    }
};
