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
        // Drop index before modifying column
        Schema::table('cases', function (Blueprint $table) {
            $table->dropIndex('cases_status_index');
        });

        // Modify the enum to include new status values
        DB::statement("ALTER TABLE cases MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'closed', 'pending', 'resolved', 'rejected', 'cancelled', 'spam', 'other') DEFAULT 'new'");

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

        // Revert to original enum without new status values
        DB::statement("ALTER TABLE cases MODIFY COLUMN status ENUM('new', 'open', 'in_progress', 'closed', 'pending') DEFAULT 'new'");

        // Update new status values back to 'closed' or 'pending'
        DB::table('cases')->whereIn('status', ['resolved', 'rejected', 'cancelled', 'spam', 'other'])->update(['status' => 'closed']);

        // Recreate the index
        Schema::table('cases', function (Blueprint $table) {
            $table->index('status', 'cases_status_index');
        });
    }
};
