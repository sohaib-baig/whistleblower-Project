<?php

namespace Database\Seeders;

use App\Models\AdminSettings;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update admin settings idempotently
        AdminSettings::firstOrCreate(
            [
                'id' => '7b16bf74-b0bf-11f0-9d4b-93313d9f6418',
            ],
            [
                'logo' => null,
                'stripe_client_id' => null,
                'stripe_secret_key' => null,
                'stripe_webhook_secret' => null,
                'iban' => null,
                'bic_code' => null,
                'bank_account' => null,
                'open_state_deadline_days' => 0,
                'close_state_deadline_days' => 0,
                'vat' => 25.00,
                'price' => 1000.00,
                'phone_hours_from' => '09:00:00',
                'phone_hours_to' => '18:00:00',
                'invoice_note' => null,
                'delete_closed_cases' => false,
            ]
        );
    }
}

