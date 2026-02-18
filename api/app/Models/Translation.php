<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\UsesUuid;

class Translation extends Model
{
    use SoftDeletes, UsesUuid;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'translatable_type',
        'translatable_id',
        'translatable_field',
        'language',
        'translated_text',
        'source_text_hash',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the parent translatable model (polymorphic relation).
     */
    public function translatable()
    {
        return $this->morphTo();
    }

    /**
     * Supported languages
     */
    public static function supportedLanguages(): array
    {
        return ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
    }

    /**
     * Google Translate language codes mapping
     */
    public static function googleLanguageCodes(): array
    {
        return [
            'en' => 'en',
            'sv' => 'sv',
            'no' => 'no',
            'da' => 'da',
            'fi' => 'fi',
            'de' => 'de',
            'fr' => 'fr',
        ];
    }
}

