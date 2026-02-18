<?php

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Support\Str;

class DateTimeService
{
    /** Convert a UTC datetime to user timezone and ISO8601 string */
    public function toUserTzIso(?CarbonInterface $utc, ?string $userTz): ?string
    {
        if ($utc === null) {
            return null;
        }
        $tz = $this->normalizeTz($userTz);
        return $utc->copy()->setTimezone($tz)->toIso8601String();
    }

    /** Validate timezone; fallback to UTC on invalid */
    public function normalizeTz(?string $tz): string
    {
        $candidate = is_string($tz) ? trim($tz) : '';
        if ($candidate !== '' && in_array($candidate, \DateTimeZone::listIdentifiers(), true)) {
            return $candidate;
        }
        return 'UTC';
    }

    /** Convert a UTC datetime to user timezone and formatted string */
    public function toUserTzFormat(?CarbonInterface $utc, ?string $userTz, string $format): ?string
    {
        if ($utc === null) {
            return null;
        }
        $tz = $this->normalizeTz($userTz);
        return $utc->copy()->setTimezone($tz)->format($format);
    }
}


