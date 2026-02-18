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
            $table->uuid('source_question_id')->nullable()->after('id');
            $table->enum('deletion_status', ['none', 'pending', 'approved', 'rejected'])
                ->default('none')
                ->after('order');
            $table->timestamp('deletion_requested_at')->nullable()->after('deletion_status');
            $table->uuid('deletion_requested_by')->nullable()->after('deletion_requested_at');
            $table->timestamp('deletion_reviewed_at')->nullable()->after('deletion_requested_by');
            $table->uuid('deletion_reviewed_by')->nullable()->after('deletion_reviewed_at');

            $table->index('source_question_id', 'case_questions_source_question_id_index');
            $table->index('deletion_status', 'case_questions_deletion_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('case_questions', function (Blueprint $table) {
            $table->dropIndex('case_questions_source_question_id_index');
            $table->dropIndex('case_questions_deletion_status_index');

            $table->dropColumn([
                'source_question_id',
                'deletion_status',
                'deletion_requested_at',
                'deletion_requested_by',
                'deletion_reviewed_at',
                'deletion_reviewed_by',
            ]);
        });
    }
};












