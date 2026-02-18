<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ValidTimezone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail(__('The :attribute must be a valid timezone.'));
            return;
        }
        $tz = trim($value);
        if ($tz === '') {
            $fail(__('The :attribute must be a valid timezone.'));
            return;
        }
        if (! in_array($tz, \DateTimeZone::listIdentifiers(), true)) {
            $fail(__('The :attribute must be a valid timezone.'));
        }
    }
}


