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
        // Modify the enum to include 'about_us' and 'reporting_page' (which exists in DB)
        DB::statement("ALTER TABLE `pages` MODIFY COLUMN `page_type` ENUM('privacy_policy', 'about_us', 'terms_conditions', 'support', 'reporting_page') DEFAULT 'privacy_policy'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values (but keep reporting_page since it exists in DB)
        DB::statement("ALTER TABLE `pages` MODIFY COLUMN `page_type` ENUM('privacy_policy', 'terms_conditions', 'support', 'reporting_page') DEFAULT 'privacy_policy'");
    }
};
