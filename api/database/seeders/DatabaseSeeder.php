<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // call all seeders
        $this->call([
            PermissionSeeder::class,
            UserSeeder::class,
            AdminSettingsSeeder::class,
            ThemeConfigurationSeeder::class,
            CategorySeeder::class,
            DepartmentSeeder::class,
            EmailTemplateSeeder::class,
            NewsSeeder::class,
            PageSeeder::class,
            QuestionSeeder::class,
            SeveritySeeder::class,
            StateSeeder::class,
        ]);
    }
}
