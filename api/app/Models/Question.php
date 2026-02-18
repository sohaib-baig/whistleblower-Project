<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Traits\Translatable;
use Illuminate\Support\Str;

class Question extends Model
{
    use SoftDeletes, Translatable;

    protected $table = 'case_questions';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * The "booting" method of the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'source_question_id',
        'user_id',
        'created_by',
        'name',
        'is_required',
        'input_type',
        'options',
        'order',
        'deletion_status',
        'deletion_requested_at',
        'deletion_requested_by',
        'deletion_reviewed_at',
        'deletion_reviewed_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'options' => 'array',
        'order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'deletion_requested_at' => 'datetime',
        'deletion_reviewed_at' => 'datetime',
    ];

    /**
     * Get the is_required attribute (convert enum to boolean).
     */
    public function getIsRequiredAttribute($value): bool
    {
        return $value === 'yes';
    }

    /**
     * Set the is_required attribute (convert boolean to enum).
     */
    public function setIsRequiredAttribute($value): void
    {
        $this->attributes['is_required'] = $value ? 'yes' : 'no';
    }

    /**
     * Get the user that owns the question.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get translatable fields
     */
    protected function getTranslatableFields(): array
    {
        return ['name']; // Note: options array translation would need special handling
    }
}
