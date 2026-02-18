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
        if (!Schema::hasColumn('case_attachments', 'attachment_path')) {
            Schema::table('case_attachments', function (Blueprint $table) {
                $table->string('attachment_path')->nullable()->after('attachment_name');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('case_attachments', 'attachment_path')) {
            Schema::table('case_attachments', function (Blueprint $table) {
                $table->dropColumn('attachment_path');
            });
        }
    }
};
