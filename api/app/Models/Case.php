<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Traits\UsesUuid;
use App\Models\Traits\Translatable;

class CaseModel extends Model
{
    use SoftDeletes;
    use UsesUuid;
    use Translatable;

    protected $table = 'cases';

    protected $keyType = 'string';
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'company_id',
        'reporting_medium',
        'title',
        'description',
        'report_type',
        'personal_details',
        'case_category_id',
        'case_manager_id',
        'email',
        'password',
        'department_id',
        'severity_id',
        'state_id',
        'status',
        'hidden_fields',
        'open_deadline_number',
        'open_deadline_period',
        'close_deadline_number',
        'close_deadline_period',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'personal_details' => 'array',
        'open_deadline_time' => 'datetime',
        'close_deadline_time' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'hidden_fields' => 'array',
    ];

    /**
     * Get the company that owns the case.
     */
    public function company()
    {
        return $this->belongsTo(User::class, 'company_id');
    }

    /**
     * Get the case manager assigned to the case.
     */
    public function caseManager()
    {
        return $this->belongsTo(User::class, 'case_manager_id');
    }

    /**
     * Get the category of the case.
     */
    public function category()
    {
        return $this->belongsTo(Category::class, 'case_category_id');
    }

    /**
     * Get the department associated with the case.
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Get the severity associated with the case.
     */
    public function severity()
    {
        return $this->belongsTo(Severity::class, 'severity_id');
    }

    /**
     * Get the state associated with the case.
     */
    public function state()
    {
        return $this->belongsTo(State::class, 'state_id');
    }

    /**
     * Get the answers for the case.
     */
    public function answers()
    {
        return $this->hasMany(CaseAnswer::class, 'case_id');
    }

    /**
     * Get translatable fields
     */
    protected function getTranslatableFields(): array
    {
        return ['title', 'description'];
    }
}
