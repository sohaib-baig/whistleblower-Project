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
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->enum('support_type', ['legal_support', 'technical_support'])->nullable()->after('title');
            $table->uuid('case_id')->nullable()->after('support_type');
            
            // Foreign key constraint for case_id
            $table->foreign('case_id')->references('id')->on('cases')->onDelete('set null');
            
            // Index for case_id
            $table->index('case_id', 'support_tickets_case_id_index');
            $table->index('support_type', 'support_tickets_support_type_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            $table->dropForeign(['case_id']);
            $table->dropIndex('support_tickets_case_id_index');
            $table->dropIndex('support_tickets_support_type_index');
            $table->dropColumn(['support_type', 'case_id']);
        });
    }
};
