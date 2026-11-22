<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('idempotency_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('key', 128);
            $table->string('claim_token', 64)->nullable();
            $table->string('request_hash', 64);
            $table->smallInteger('response_code')->default(201);
            $table->longText('response_body')->nullable();
            $table->string('status', 20)->default('processing');
            $table->timestamps();

            $table->unique(['tenant_id', 'key']);
            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('idempotency_keys');
    }
};
