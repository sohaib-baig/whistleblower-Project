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
        Schema::table('case_questions', function (Blueprint $table) {
            $table->uuid('created_by')->nullable()->after('user_id');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
            $table->index('created_by', 'case_questions_created_by_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_questions', function (Blueprint $table) {
            $table->dropIndex('case_questions_created_by_index');
            $table->dropForeign(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
