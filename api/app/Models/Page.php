<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\UsesUuid;
use App\Models\Traits\Translatable;
use Illuminate\Support\Str;

class Page extends Model
{
    use SoftDeletes, UsesUuid, Translatable;

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'page_type',
        'language',
        'page_title',
        'page_content',
        'page_slug',
        'status',
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
     * Get translatable fields
     */
    protected function getTranslatableFields(): array
    {
        return ['page_title', 'page_content'];
    }

    /**
     * Get the user that created this page
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate a unique slug from page title
     */
    public function generateSlug(): string
    {
        if (empty($this->page_title)) {
            return '';
        }

        $baseSlug = Str::slug($this->page_title);
        $slug = $baseSlug;
        $counter = 1;

        // Ensure uniqueness per user_id and page_type combination
        while (static::where('user_id', $this->user_id)
            ->where('page_type', $this->page_type)
            ->where('page_slug', $slug)
            ->where('id', '!=', $this->id)
            ->exists()) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        // Generate slug when creating or updating if page_title changed
        static::saving(function ($page) {
            if ($page->isDirty('page_title') && !empty($page->page_title)) {
                $page->page_slug = $page->generateSlug();
            }
        });
    }
}

