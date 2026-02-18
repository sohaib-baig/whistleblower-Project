<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Models\Traits\UsesUuid;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use App\Mail\ForgotPasswordMail;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable implements MustVerifyEmail
{
	/** @use HasFactory<\Database\Factories\UserFactory> */
	use HasApiTokens, HasFactory, Notifiable, HasRoles, UsesUuid, SoftDeletes;

	protected $keyType = 'string';
	public $incrementing = false;

	/**
	 * The attributes that are mass assignable.
	 *
	 * @var list<string>
	 */
	protected $fillable = [
		'name',
		'first_name',
		'last_name',
		'company_name',
		'company_number',
		'company_slug',
		'company_id',
		'role',
		'email',
		'password',
		'initial_password',
		'phone',
		'phone_hours_from',
		'phone_hours_to',
		'phone_hours_format',
		'avatar_path',
		'country',
		'vat_number',
		'address',
		'physical_address',
		'state',
		'city',
		'zip_code',
		'user_language',		
		'is_active',
		'two_factor_enabled',
		'two_factor_method',
		'two_factor_secret',
		'two_factor_email_code',
		'two_factor_email_expires_at',
	];

	/**
	 * The attributes that should be hidden for serialization.
	 *
	 * @var list<string>
	 */
	protected $hidden = [
		'password',
		'remember_token',
		'initial_password',
	];

	/**
	 * Attributes that should be appended to JSON output.
	 *
	 * @var list<string>
	 */
	protected $appends = [
		'avatar_url',
	];

	/**
	 * Get the attributes that should be cast.
	 *
	 * @return array<string, string>
	 */
	protected function casts(): array
	{
		return [
			'email_verified_at' => 'datetime',
			'password' => 'hashed',
			'is_active' => 'integer',
			'two_factor_enabled' => 'boolean',
			'two_factor_email_expires_at' => 'datetime',
		];
	}

	public function notifications(): HasMany
	{
		return $this->hasMany(Notification::class);
	}

	/**
	 * Get the theme configuration for the user.
	 */
	public function themeConfiguration(): HasOne
	{
		return $this->hasOne(ThemeConfiguration::class);
	}

	/**
	 * Scope to exclude soft-deleted users
	 */
	public function scopeActive($query)
	{
		return $query->whereNull('deleted_at');
	}

	/**
	 * Scope to include only soft-deleted users
	 */
	public function scopeDeleted($query)
	{
		return $query->whereNotNull('deleted_at');
	}

	/**
	 * Accessor for public avatar URL based on stored avatar_path.
	 */
	public function getAvatarUrlAttribute(): ?string
	{
		if (empty($this->avatar_path)) {
			return null;
		}
		return Storage::url($this->avatar_path);
	}

	/**
	 * Override the default password reset notification to use a custom mailable.
	 */
	public function sendPasswordResetNotification($token): void
	{
		$frontend = env('FRONTEND_URL') ?: config('app.url');
		$resetUrl = rtrim((string) $frontend, '/')
			. '/auth/reset-password?token=' . urlencode($token)
			. '&email=' . urlencode($this->getEmailForPasswordReset());

		try {
			Log::info('Queueing password reset email', [
				'user_id' => $this->getKey(),
				'email' => $this->getEmailForPasswordReset(),
				'queue_connection' => config('queue.default'),
				'queue_driver' => config('queue.connections.' . config('queue.default') . '.driver'),
			]);

			Mail::to($this->getEmailForPasswordReset())
				->queue(new ForgotPasswordMail($this, $resetUrl));

			Log::info('Password reset email queued successfully', [
				'user_id' => $this->getKey(),
				'email' => $this->getEmailForPasswordReset(),
			]);
		} catch (\Throwable $exception) {
			Log::error('Failed to queue password reset email', [
				'user_id' => $this->getKey(),
				'email' => $this->getEmailForPasswordReset(),
				'queue_connection' => config('queue.default'),
				'message' => $exception->getMessage(),
			]);

			throw $exception;
		}
	}
}
