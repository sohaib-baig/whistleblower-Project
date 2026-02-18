<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Question;
use App\Models\User;

class QuestionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin user ID from users table
        $adminUser = User::whereHas('roles', function ($query) {
            $query->where('name', 'admin');
        })->first();

        if (!$adminUser) {
            $this->command->error('Admin user not found. Please ensure admin user exists in the database.');
            return;
        }

        $adminId = $adminUser->id;

        $questions = [            
            [
                'id' => '2f92b1fd-2bed-4770-95a9-a3ed7814a25d',
                'user_id' => $adminId,
                'name' => 'Have you reported this previously? If so, what and when to whom? What action did they take? — What is the impact for the organization from your view?',
                'is_required' => 'yes',
                'input_type' => 'text',
                'options' => null,
                'order' => 7,
            ],
            [
                'id' => '5ac3cd30-e5f9-4235-a8c0-15f17532c9be',
                'user_id' => $adminId,
                'name' => 'Have I understood your concerns correctly?',
                'is_required' => 'yes',
                'input_type' => 'select',
                'options' => ['Yes', 'No'],
                'order' => 2,
            ],
            [
                'id' => '7074de15-fd06-487e-bdb0-12add11b9c65',
                'user_id' => $adminId,
                'name' => 'Is there anyone else with first-hand knowledge we can contact?',
                'is_required' => 'no',
                'input_type' => 'text',
                'options' => null,
                'order' => 1,
            ],
            [
                'id' => '7f2fe2ad-c75b-4abc-887b-c81cf56cbd9b',
                'user_id' => $adminId,
                'name' => 'Is management involved or aware of the wrongdoing?',
                'is_required' => 'yes',
                'input_type' => 'radio',
                'options' => ['Yes', 'No'],
                'order' => 8,
            ],
            [
                'id' => '853cead9-28af-4280-adc4-fa849ac3079a',
                'user_id' => $adminId,
                'name' => 'Are there any risks to you or others?',
                'is_required' => 'yes',
                'input_type' => 'radio',
                'options' => ['Yes', 'No'],
                'order' => 9,
            ],
            [
                'id' => '89e18ef9-0773-4c30-8d92-6bca094d5a9a',
                'user_id' => $adminId,
                'name' => 'When did the wrongdoing take place?',
                'is_required' => 'yes',
                'input_type' => 'select',
                'options' => ['Past', 'Current', 'Future', 'Ongoing'],
                'order' => 4,
            ],
            [
                'id' => 'c548beeb-3092-4ed5-9f83-9a0007107d66',
                'user_id' => $adminId,
                'name' => 'Has anyone tried to hide this, or tried to discourage you from sharing your concern? If so, please tell us who, and how.?',
                'is_required' => 'yes',
                'input_type' => 'text',
                'options' => null,
                'order' => 3,
            ],
            [
                'id' => 'cc378671-171d-40c8-8232-49c3798447d5',
                'user_id' => $adminId,
                'name' => 'Where did the wrongdoing take place (jurisdiction)?',
                'is_required' => 'yes',
                'input_type' => 'text',
                'options' => null,
                'order' => 6,
            ],
            [
                'id' => 'd96873c3-6c16-4ede-a442-14cbcc2bf63c',
                'user_id' => $adminId,
                'name' => 'Who is involved in the wrongdoing?',
                'is_required' => 'yes',
                'input_type' => 'text',
                'options' => null,
                'order' => 5,
            ],
            [
                'id' => 'e3b79772-61d6-4433-9d84-3e169b5c9007',
                'user_id' => $adminId,
                'name' => 'Has anyone tried to hide this, or tried to discourage you from sharing your concern? If so, please tell us who, and how.?',
                'is_required' => 'yes',
                'input_type' => 'text',
                'options' => null,
                'order' => 10,
            ],
        ];

        foreach ($questions as $questionData) {
            Question::updateOrCreate(
                ['id' => $questionData['id']],
                $questionData
            );
        }
    }
}
