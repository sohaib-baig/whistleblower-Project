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
        Schema::table('cases', function (Blueprint $table) {
            $table->integer('open_deadline_number')->nullable()->after('open_deadline_time');
            $table->enum('open_deadline_period', ['daily', 'weekly', 'monthly', 'yearly'])->nullable()->after('open_deadline_number');
            $table->integer('close_deadline_number')->nullable()->after('close_deadline_time');
            $table->enum('close_deadline_period', ['daily', 'weekly', 'monthly', 'yearly'])->nullable()->after('close_deadline_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cases', function (Blueprint $table) {
            $table->dropColumn(['open_deadline_number', 'open_deadline_period', 'close_deadline_number', 'close_deadline_period']);
        });
    }
};
