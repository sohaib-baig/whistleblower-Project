<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UpdateCompanySlugSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all users that have a company_name
        $users = User::whereNotNull('company_name')
            ->where('company_name', '!=', '')
            ->get();

        $updatedCount = 0;

        foreach ($users as $user) {
            // Generate company slug from company name
            $companySlug = Str::slug($user->company_name);

            // Update the company_slug column
            $user->update([
                'company_slug' => $companySlug,
            ]);

            $updatedCount++;

            Log::info('Updated company slug for user', [
                'user_id' => $user->id,
                'email' => $user->email,
                'company_name' => $user->company_name,
                'company_slug' => $companySlug,
            ]);
        }

        $this->command->info("Updated company_slug for {$updatedCount} user(s).");
    }
}
