<?php

namespace Database\Seeders;

use App\Models\State;
use Illuminate\Database\Seeder;

class StateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $states = [
            ['name' => 'California', 'status' => 'active'],
            ['name' => 'New York', 'status' => 'active'],
            ['name' => 'Texas', 'status' => 'active'],
            ['name' => 'Florida', 'status' => 'active'],
            ['name' => 'Illinois', 'status' => 'active'],
            ['name' => 'Pennsylvania', 'status' => 'active'],
            ['name' => 'Ohio', 'status' => 'active'],
            ['name' => 'Georgia', 'status' => 'inactive'],
        ];

        foreach ($states as $state) {
            State::create($state);
        }
    }
}
