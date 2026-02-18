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
        Schema::create('case_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('case_id');
            $table->uuid('question_id');
            $table->longText('answer')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign key constraints
            $table->foreign('case_id')->references('id')->on('cases')->onDelete('cascade');
            $table->foreign('question_id')->references('id')->on('case_questions')->onDelete('cascade');
            
            // Indexes
            $table->index('case_id', 'case_answers_case_id_index');
            $table->index('question_id', 'case_answers_question_id_index');
            $table->index('deleted_at', 'case_answers_deleted_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_answers');
    }
};
