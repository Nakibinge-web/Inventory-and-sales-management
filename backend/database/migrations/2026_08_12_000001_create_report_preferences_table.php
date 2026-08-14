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
        Schema::create('report_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('report_type');
            $table->string('frequency');
            $table->boolean('is_enabled')->default(true);
            $table->string('delivery_method')->default('email');
            $table->string('recipient_email')->nullable();
            $table->timestamp('last_sent_at')->nullable();
            $table->timestamps();

            // Prevent duplicate preferences for the same report per tenant
            $table->unique(['tenant_id', 'report_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_preferences');
    }
};
