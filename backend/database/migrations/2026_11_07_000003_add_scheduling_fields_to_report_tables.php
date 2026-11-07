<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_preferences', function (Blueprint $table) {
            $table->string('time_of_day')->nullable()->after('frequency');
            $table->string('day_of_week')->nullable()->after('time_of_day');
            $table->unsignedTinyInteger('day_of_month')->nullable()->after('day_of_week');
            $table->unsignedInteger('interval_minutes')->nullable()->after('day_of_month');
            $table->timestamp('next_run_at')->nullable()->after('last_sent_at');
        });

        Schema::table('generated_reports', function (Blueprint $table) {
            $table->string('title')->nullable()->after('report_type');
            $table->date('period_start')->nullable()->after('title');
            $table->date('period_end')->nullable()->after('period_start');
            $table->decimal('total_sales', 14, 2)->nullable()->after('period_end');
            $table->decimal('total_profit', 14, 2)->nullable()->after('total_sales');
            $table->unsignedInteger('total_transactions')->nullable()->after('total_profit');
            $table->string('source')->default('automated')->after('total_transactions');
        });
    }

    public function down(): void
    {
        Schema::table('report_preferences', function (Blueprint $table) {
            $table->dropColumn(['time_of_day', 'day_of_week', 'day_of_month', 'interval_minutes', 'next_run_at']);
        });

        Schema::table('generated_reports', function (Blueprint $table) {
            $table->dropColumn(['title', 'period_start', 'period_end', 'total_sales', 'total_profit', 'total_transactions', 'source']);
        });
    }
};

