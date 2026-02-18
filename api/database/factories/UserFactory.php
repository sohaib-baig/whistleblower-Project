<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'company_name' => fake()->company(),
            'company_id' => fake()->uuid(),
            'email' => fake()->unique()->safeEmail(),
            'role' => fake()->randomElement(['admin', 'company', 'case_manager']),
            'password' => static::$password ??= Hash::make('password'),
            'phone' => fake()->optional(0.8)->phoneNumber() ?? '+12345678900',
            'country' => fake()->optional(0.7)->country() ?? 'United States',
            'address' => fake()->optional(0.6)->streetAddress() ?? '123 Default Street',
            'state' => fake()->optional(0.6)->state() ?? 'New York',
            'city' => fake()->optional(0.6)->city() ?? 'New York',
            'zip_code' => fake()->optional(0.6)->postcode() ?? '10001',
            'is_active' => fake()->boolean(90),
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),            
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
