<?php

namespace Database\Seeders;

use App\Models\Severity;
use Illuminate\Database\Seeder;

class SeveritySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $severities = [
            ['name' => 'Critical', 'status' => 'active'],
            ['name' => 'High', 'status' => 'active'],
            ['name' => 'Medium', 'status' => 'active'],
            ['name' => 'Low', 'status' => 'active'],
            ['name' => 'Informational', 'status' => 'active'],
            ['name' => 'Urgent', 'status' => 'active'],
            ['name' => 'Minor', 'status' => 'active'],
            ['name' => 'Trivial', 'status' => 'inactive'],
        ];

        foreach ($severities as $severity) {
            Severity::create($severity);
        }
    }
}
