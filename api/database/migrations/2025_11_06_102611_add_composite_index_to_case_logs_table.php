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
        Schema::table('case_logs', function (Blueprint $table) {
            // Add composite index for faster queries when filtering by case_id and ordering by created_at
            $table->index(['case_id', 'created_at'], 'case_logs_case_id_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_logs', function (Blueprint $table) {
            $table->dropIndex('case_logs_case_id_created_at_index');
        });
    }
};
