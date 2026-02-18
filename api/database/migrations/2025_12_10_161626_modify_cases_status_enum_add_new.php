<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include 'new' as the first option and set default
        // MySQL requires dropping and recreating the column for enum modification
        Schema::table('cases', function (Blueprint $table) {
            $table->dropIndex('cases_status_index');
        });

        DB::statement("ALTER TABLE cases MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'closed', 'pending') DEFAULT 'new'");

        // Update existing NULL status values to 'new' (now that 'new' is in the enum)
        DB::table('cases')->whereNull('status')->update(['status' => 'new']);

        // Recreate the index
        Schema::table('cases', function (Blueprint $table) {
            $table->index('status', 'cases_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop index before modifying column
        Schema::table('cases', function (Blueprint $table) {
            $table->dropIndex('cases_status_index');
        });

        // Revert to original enum without 'new'
        DB::statement("ALTER TABLE cases MODIFY COLUMN status ENUM('open', 'in_progress', 'closed', 'pending') DEFAULT NULL");

        // Update 'new' status values back to NULL or 'open'
        DB::table('cases')->where('status', 'new')->update(['status' => 'open']);

        // Recreate the index
        Schema::table('cases', function (Blueprint $table) {
            $table->index('status', 'cases_status_index');
        });
    }
};
