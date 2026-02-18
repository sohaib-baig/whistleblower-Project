<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Traits\UsesUuid;

abstract class BaseModel extends Model
{
    use UsesUuid;
}


