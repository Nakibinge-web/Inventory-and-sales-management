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
        Schema::table('tenants', function (Blueprint $table) {
            // Add a JSON column to store multiple contacts
            $table->json('contacts')->nullable()->after('phone');
            
            // Migrate existing phone data to contacts array
            // This will be done in a separate step after the column is added
        });
        
        // Migrate existing phone numbers to contacts array
        DB::statement("
            UPDATE tenants 
            SET contacts = JSON_ARRAY(JSON_OBJECT('type', 'primary', 'number', phone))
            WHERE phone IS NOT NULL AND phone != ''
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('contacts');
        });
    }
};
