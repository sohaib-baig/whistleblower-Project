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
        Schema::table('support_ticket_chats', function (Blueprint $table) {
            $table->boolean('read_by_admin')->default(false)->after('created_from')->index();
            $table->boolean('read_by_company')->default(false)->after('read_by_admin')->index();
            $table->boolean('read_by_case_manager')->default(false)->after('read_by_company')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_ticket_chats', function (Blueprint $table) {
            $table->dropColumn(['read_by_admin', 'read_by_company', 'read_by_case_manager']);
        });
    }
};
