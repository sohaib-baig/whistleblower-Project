<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Competition law', 'status' => 'active'],
            ['name' => 'Conflict of interest', 'status' => 'active'],
            ['name' => 'Corruption', 'status' => 'active'],
            ['name' => 'Fraud', 'status' => 'active'],
            ['name' => 'Money laundering', 'status' => 'active'],
            ['name' => 'Other', 'status' => 'active'],
            ['name' => 'Harassment', 'status' => 'inactive'],
            ['name' => 'Discrimination', 'status' => 'inactive'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['name' => $category['name']],
                ['status' => $category['status']]
            );
        }

        $this->command->info('Categories seeded successfully!');
    }
}
