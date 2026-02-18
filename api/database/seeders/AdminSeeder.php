<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create first admin user
        $admin = User::firstOrCreate(
            ['email' => 'info@lewlex.se'],
            [
                'name' => 'Christoffer Lewinowitz',
                'first_name' => 'Christoffer',
                'last_name' => 'Lewinowitz',
                'company_name' => 'Wisling',
                'email' => 'info@lewlex.se',
                'role' => 'admin',
                'password' => Hash::make('N6mTZ6ZY'),
                'phone' => '+46763095915',
                'country' => 'Sweden',
                'address' => 'Södraskog 3, Ramkvilla, JKL, 57474',
                'state' => 'JKL',
                'city' => 'Ramkvilla',
                'zip_code' => '57474',
                'is_active' => true,
                'email_verified_at' => now(),
                'remember_token' => \Illuminate\Support\Str::random(10),                
            ]
        );
        $admin->assignRole('admin');

        // Create second admin user
        $admin = User::firstOrCreate(
            ['email' => 'lily@lewlex.se'],
            [
                'name' => 'Lily Lewinowitz',
                'first_name' => 'Lily',
                'last_name' => 'Lewinowitz',
                'company_name' => 'Wisling',
                'email' => 'lily@lewlex.se',
                'role' => 'admin',
                'password' => Hash::make('N6mTZ6ZY'),
                'phone' => '+46763095915',
                'country' => 'Sweden',
                'address' => 'Södraskog 3, Ramkvilla, JKL, 57474',
                'state' => 'JKL',
                'city' => 'Ramkvilla',
                'zip_code' => '57474',
                'is_active' => true,
                'email_verified_at' => now(),
                'remember_token' => \Illuminate\Support\Str::random(10),                
            ]
        );
        $admin->assignRole('admin');

        // Create third admin user
        $admin = User::firstOrCreate(
            ['email' => 'divyangchauhan.cmpica@gmail.com'],
            [
                'name' => 'Divyang Chauhan',
                'first_name' => 'Divyang',
                'last_name' => 'Chauhan',
                'company_name' => 'Wisling',
                'email' => 'divyangchauhan.cmpica@gmail.com',
                'role' => 'admin',
                'password' => Hash::make('N6mTZ6ZY'),
                'phone' => '+46763095915',
                'country' => 'India',
                'address' => 'Ahmedabad',
                'state' => 'Gujarat',
                'city' => 'Ahmedabad',
                'zip_code' => '380058',
                'is_active' => true,
                'email_verified_at' => now(),
                'remember_token' => \Illuminate\Support\Str::random(10),                
            ]
        );
        $admin->assignRole('admin');
    }
}
