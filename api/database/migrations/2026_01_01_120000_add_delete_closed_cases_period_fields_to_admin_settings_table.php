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
        Schema::table('admin_settings', function (Blueprint $table) {
            $table->integer('delete_closed_cases_period')->nullable()->after('delete_closed_cases');
            $table->enum('delete_closed_cases_period_type', ['daily', 'weekly', 'monthly', 'yearly'])->nullable()->after('delete_closed_cases_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admin_settings', function (Blueprint $table) {
            $table->dropColumn(['delete_closed_cases_period', 'delete_closed_cases_period_type']);
        });
    }
};



