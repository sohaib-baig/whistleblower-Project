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
        Schema::create('cases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('company_id');
            $table->enum('reporting_medium', ['written', 'oral', 'phone_call', 'physical_meeting'])->default('written');
            $table->string('title')->nullable();
            $table->longText('description')->nullable();
            $table->enum('report_type', ['report_annonymously', 'report_with_personal_details'])->default('report_annonymously');
            $table->json('personal_details')->nullable();
            $table->uuid('case_category_id');
            $table->uuid('case_manager_id')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->uuid('department_id')->nullable();
            $table->uuid('severity_id')->nullable();
            $table->uuid('state_id')->nullable();
            $table->json('hidden_fields')->nullable();
            $table->enum('status', ['open', 'in_progress', 'closed', 'pending'])->nullable();
            $table->timestamp('open_deadline_time')->nullable();
            $table->timestamp('close_deadline_time')->nullable();
            $table->string('other_report_link')->nullable();
            $table->enum('automatic_delete', ['yes', 'no'])->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            // Foreign key constraints
            $table->foreign('company_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('case_category_id')->references('id')->on('categories')->onDelete('cascade');
            $table->foreign('case_manager_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('set null');
            $table->foreign('severity_id')->references('id')->on('severities')->onDelete('set null');
            $table->foreign('state_id')->references('id')->on('states')->onDelete('set null');
            
            // Indexes
            $table->index('company_id', 'cases_company_id_index');
            $table->index('case_category_id', 'cases_case_category_id_index');
            $table->index('case_manager_id', 'cases_case_manager_id_index');
            $table->index('status', 'cases_status_index');
            $table->index('deleted_at', 'cases_deleted_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cases');
    }
};
