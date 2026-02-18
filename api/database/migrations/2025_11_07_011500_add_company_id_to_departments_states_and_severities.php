<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->uuid('company_id')->nullable()->after('id');
            $table->foreign('company_id')->references('id')->on('users')->nullOnDelete();
            $table->index('company_id');
        });

        Schema::table('states', function (Blueprint $table) {
            $table->uuid('company_id')->nullable()->after('id');
            $table->foreign('company_id')->references('id')->on('users')->nullOnDelete();
            $table->index('company_id');
        });

        Schema::table('severities', function (Blueprint $table) {
            $table->uuid('company_id')->nullable()->after('id');
            $table->foreign('company_id')->references('id')->on('users')->nullOnDelete();
            $table->index('company_id');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropIndex('departments_company_id_index');
            $table->dropColumn('company_id');
        });

        Schema::table('states', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropIndex('states_company_id_index');
            $table->dropColumn('company_id');
        });

        Schema::table('severities', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropIndex('severities_company_id_index');
            $table->dropColumn('company_id');
        });
    }
};

