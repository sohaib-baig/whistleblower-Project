<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ThemeConfiguration extends Model
{
    use HasFactory, HasUuids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'mode',
        'contrast',
        'right_left',
        'compact',
        'color_setting',
        'navigation_type',
        'navigation_color',
        'typography',
        'font_size',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'mode' => 'boolean',
        'contrast' => 'boolean',
        'right_left' => 'boolean',
        'compact' => 'boolean',
        'navigation_type' => 'integer',
        'navigation_color' => 'boolean',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'mode' => 0, // light
        'contrast' => 0, // default
        'right_left' => 0, // ltr
        'compact' => 1, // true (compact layout enabled)
        'color_setting' => 'default',
        'navigation_type' => 1, // vertical
        'navigation_color' => 0, // integrate
        'typography' => 'Public Sans',
        'font_size' => '16',
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
     * Get the user that owns the theme configuration.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

