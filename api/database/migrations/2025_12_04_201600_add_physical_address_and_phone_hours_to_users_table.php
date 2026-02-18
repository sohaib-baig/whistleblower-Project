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
        Schema::table('users', function (Blueprint $table) {
            $table->text('physical_address')->nullable()->after('address');
            $table->time('phone_hours_from')->nullable()->after('phone');
            $table->time('phone_hours_to')->nullable()->after('phone_hours_from');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['physical_address', 'phone_hours_from', 'phone_hours_to']);
        });
    }
};
