<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default system users with specific roles
        $this->createSystemUsers();

        // Create additional users via factory for testing
        $this->createAdditionalUsers();
    }

    /**
     * Create system users with predefined roles
     */
    private function createSystemUsers(): void
    {
        // create admin user
        $admin = User::firstOrCreate(
            ['email' => 'wisling_admin@yopmail.com'],
            [
                'name' => 'Wisling Admin',
                'first_name' => 'Wisling',
                'last_name' => 'Admin',
                'company_name' => 'Wisling',
                'email' => 'wisling_admin@yopmail.com',
                'role' => 'admin',
                'password' => Hash::make('N6mTZ6ZY'),
                'phone' => '+12345678900',
                'country' => 'United States',
                'address' => '123 Admin Street',
                'state' => 'New York',
                'city' => 'New York',
                'zip_code' => '10001',
                'is_active' => true,
                'email_verified_at' => now(),
                'remember_token' => \Illuminate\Support\Str::random(10),                
            ]
        );
        $admin->assignRole('admin');

        // create company user
        $company = User::firstOrCreate(
            ['email' => 'company@yopmail.com'],
            [
                'first_name' => 'Company',
                'last_name' => 'A',
                'company_name' => 'Company A',
                'name' => 'Company A',
                'email' => 'company@yopmail.com',
                'role' => 'company',
                'password' => Hash::make('Company@1234'),
                'phone' => '+12345678900',
                'country' => 'United States',
                'address' => '456 Buyer Avenue',
                'state' => 'California',
                'city' => 'Los Angeles',
                'zip_code' => '90210',
                'is_active' => true,
                'email_verified_at' => now(),
                'remember_token' => \Illuminate\Support\Str::random(10),                
            ]
        );
        $company->assignRole('company');

        // create media buyer user
        $caseManager = User::firstOrCreate(
            ['email' => 'case_manager@yopmail.com'],
            [
                'name' => 'Case Manager',
                'first_name' => 'Case',
                'last_name' => 'Manager',
                'company_name' => 'Company A',
                'company_id' => $company->id,
                'email' => 'case_manager@yopmail.com',
                'role' => 'case_manager',
                'password' => Hash::make('Manager@1234'),
                'phone' => '+12345678900',
                'country' => 'United States',
                'address' => '789 Media Boulevard',
                'state' => 'Texas',
                'city' => 'Austin',
                'zip_code' => '73301',
                'is_active' => true,
                'email_verified_at' => now(),
                'remember_token' => \Illuminate\Support\Str::random(10),                
            ]
        );
        $caseManager->assignRole('case_manager');        
    }

    /**
     * Create additional users via factory for testing purposes
     */
    private function createAdditionalUsers(): void
    {
        // Create additional users of each role type for comprehensive testing

        // Create 5 additional company users
        for ($i = 1; $i <= 5; $i++) {
            $user = User::factory()->create([
                'email_verified_at' => now(),
            ]);
            $user->assignRole('company');
        }

        // Create 5 additional case manager users
        for ($i = 1; $i <= 5; $i++) {
            $user = User::factory()->create([
                'email_verified_at' => now(),
            ]);
            $user->assignRole('case_manager');
        }
    }
}
