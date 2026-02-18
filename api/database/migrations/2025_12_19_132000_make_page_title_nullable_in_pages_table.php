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
        // Make page_title nullable
        DB::statement('ALTER TABLE `pages` MODIFY COLUMN `page_title` VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert page_title to NOT NULL (set existing NULL values to empty string first)
        DB::statement("UPDATE `pages` SET `page_title` = '' WHERE `page_title` IS NULL");
        DB::statement('ALTER TABLE `pages` MODIFY COLUMN `page_title` VARCHAR(255) NOT NULL');
    }
};
