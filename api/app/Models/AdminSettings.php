<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminSettings extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'logo',
        'small_logo',
        'stripe_client_id',
        'stripe_secret_key',
        'stripe_webhook_secret',
        'iban',
        'bic_code',
        'bank_account',
        'open_state_deadline_days',
        'close_state_deadline_days',
        'vat',
        'price',
        'phone_hours_from',
        'phone_hours_to',
        'invoice_note',
        'delete_closed_cases',
        'delete_closed_cases_period',
        'delete_closed_cases_period_type',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'stripe_secret_key',
        'stripe_webhook_secret',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'open_state_deadline_days' => 'integer',
        'close_state_deadline_days' => 'integer',
        'vat' => 'decimal:2',
        'price' => 'decimal:2',
        'delete_closed_cases' => 'boolean',
    ];

    /**
     * The primary key type.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;
}

