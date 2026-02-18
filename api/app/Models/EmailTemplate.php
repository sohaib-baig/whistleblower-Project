<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmailTemplate extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'subject',
        'status',
        'content',
        'placeholder',
        'language',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'deleted_at' => 'datetime',
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

    /**
     * Get email template by name and language, with fallback to English
     *
     * @param string $name Template name
     * @param string|null $language User language (defaults to 'en' if null)
     * @param bool $activeOnly Only return active templates
     * @return EmailTemplate|null
     */
    public static function getByNameAndLanguage(string $name, ?string $language = null, bool $activeOnly = true): ?self
    {
        $language = $language ?? 'en';
        
        $query = static::where('name', $name);
        
        if ($activeOnly) {
            $query->where('status', 'active');
        }
        
        // Try to get template in user's language
        $template = $query->where('language', $language)->first();
        
        // If not found and language is not English, fallback to English
        if (!$template && $language !== 'en') {
            $template = $query->where('language', 'en')->first();
        }
        
        return $template;
    }
}

