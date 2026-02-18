<?php

namespace App\Policies;

use Spatie\Csp\Directive;
use Spatie\Csp\Policy;
use Spatie\Csp\Preset;

class TurnstileCspPolicy implements Preset
{
    public function configure(Policy $policy): void
    {
        // Start with Basic preset configuration
        $basic = new \Spatie\Csp\Presets\Basic();
        $basic->configure($policy);

        // Allow Cloudflare Turnstile
        $policy->add(Directive::SCRIPT, 'https://challenges.cloudflare.com');
        $policy->add(Directive::FRAME, 'https://challenges.cloudflare.com');
        $policy->add(Directive::STYLE, 'https://challenges.cloudflare.com');
        $policy->add(Directive::CONNECT, 'https://challenges.cloudflare.com');
        $policy->add(Directive::IMG, 'https://challenges.cloudflare.com');
        $policy->add(Directive::FONT, 'https://challenges.cloudflare.com');
    }
}

