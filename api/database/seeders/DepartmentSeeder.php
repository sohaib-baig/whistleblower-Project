<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['name' => 'Human Resources', 'status' => 'active'],
            ['name' => 'Finance', 'status' => 'active'],
            ['name' => 'Sales', 'status' => 'active'],
            ['name' => 'Marketing', 'status' => 'active'],
            ['name' => 'Operations', 'status' => 'active'],
            ['name' => 'IT', 'status' => 'active'],
            ['name' => 'Legal', 'status' => 'active'],
            ['name' => 'Customer Service', 'status' => 'inactive'],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
