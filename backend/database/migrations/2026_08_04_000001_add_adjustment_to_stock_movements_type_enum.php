<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite does not support MODIFY COLUMN. On SQLite (used for testing),
        // the enum column is stored as a plain string so no DDL change is needed.
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        // Alter the ENUM to include ADJUSTMENT
        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        // Revert — any existing ADJUSTMENT rows will be truncated back to ''
        DB::statement("ALTER TABLE stock_movements MODIFY COLUMN type ENUM('IN', 'OUT') NOT NULL");
    }
};
