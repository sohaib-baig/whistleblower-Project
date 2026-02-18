<?php

namespace App\Services;

use App\Models\AdminSettings;
use App\Models\EmailTemplate;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EmailTemplateService
{
    /**
     * Render an email template by its name, applying replacements and wrapping it
     * in the shared transactional layout. Returns an array with the resolved
     * subject, rendered HTML, and whether the fallback content was used.
     *
     * @param  string  $name
     * @param  array<string, scalar|Stringable|null>  $data
     * @param  array<string, mixed>  $options
     * @return array{subject:string, html:string, used_fallback:bool}
     */
    public function renderByName(string $name, array $data = [], array $options = []): array
    {
        $language = $options['language'] ?? null;
        
        // If user object is provided in data, use user's language preference
        if (isset($data['user']) && $data['user'] instanceof \App\Models\User) {
            $language = $data['user']->user_language ?? $language ?? 'en';
        }

        // Use the helper method that handles language fallback to English
        $template = EmailTemplate::getByNameAndLanguage($name, $language, true);

        $fallbackSubject = $options['fallback_subject'] ?? $name;
        $fallbackContent = $options['fallback_content'] ?? '';

        $baseReplacements = $this->buildReplacements($data);

        if ($template) {
            $subject = $this->applyReplacements($template->subject, $baseReplacements);
            $content = $this->applyReplacements($template->content, $baseReplacements);
            $usedFallback = false;
        } else {
            $subject = $this->applyReplacements($fallbackSubject, $baseReplacements);
            $content = $this->applyReplacements($fallbackContent, $baseReplacements);
            $usedFallback = true;
        }

        $buttonOption = $options['button'] ?? null;
        $subcopyOption = $options['subcopy'] ?? null;
        $buttonForTemplate = $options['button_when_template'] ?? null;
        $subcopyForTemplate = $options['subcopy_when_template'] ?? null;
        $forceButton = (bool) ($options['force_button'] ?? false);
        $forceSubcopy = (bool) ($options['force_subcopy'] ?? false);

        $button = $usedFallback
            ? $buttonOption
            : ($forceButton ? ($buttonForTemplate ?? $buttonOption) : $buttonForTemplate);

        $subcopy = $usedFallback
            ? $subcopyOption
            : ($forceSubcopy ? ($subcopyForTemplate ?? $subcopyOption) : $subcopyForTemplate);

        $html = $this->wrapContent($content, array_merge($options, [
            'button' => $button,
            'subcopy' => $subcopy,
            'fallback_content' => $fallbackContent,
        ]));

        return [
            'subject' => trim($subject) !== '' ? $subject : $fallbackSubject,
            'html' => $html,
            'used_fallback' => $usedFallback,
        ];
    }

    /**
     * Wrap raw HTML content inside the shared transactional layout.
     *
     * @param  string  $content
     * @param  array<string, mixed>  $options
     */
    public function wrapContent(string $content, array $options = []): string
    {
        $content = trim($content) !== '' ? $content : ($options['fallback_content'] ?? '');

        return view('emails.layouts.transactional', [
            'content' => $content,
            'appName' => $options['app_name'] ?? config('app.name'),
            'logoUrl' => $options['logo_url'] ?? $this->resolveLogoUrl(),
            'preheader' => $options['preheader'] ?? null,
            'button' => $this->normalizeButtonOption($options['button'] ?? null),
            'subcopy' => $options['subcopy'] ?? null,
        ])->render();
    }

    /**
     * Build a replacements array supporting multiple placeholder formats.
     *
     * @param  array<string, scalar|Stringable|null>  $data
     * @return array<string, string>
     */
    private function buildReplacements(array $data): array
    {
        $defaults = [
            'app_name' => config('app.name'),
            'app.url' => config('app.url'),
            'year' => now()->format('Y'),
        ];

        $merged = array_merge($defaults, $data);
        $replacements = [];

        foreach ($merged as $key => $value) {
            if ($value === null) {
                $value = '';
            }

            if (is_bool($value)) {
                $value = $value ? 'Yes' : 'No';
            }

            if (!is_scalar($value) && !method_exists($value, '__toString')) {
                continue;
            }

            $stringValue = (string) $value;
            foreach ($this->placeholderVariants((string) $key) as $variant) {
                $replacements[$variant] = $stringValue;
            }
        }

        return $replacements;
    }

    /**
     * Generate supported placeholder variants for the provided key.
     *
     * @return array<int, string>
     */
    private function placeholderVariants(string $key): array
    {
        $normalized = str_replace(['.', '-', '__'], '_', trim($key));
        $normalized = preg_replace('/\s+/', '_', $normalized) ?? $normalized;

        $lower = Str::lower($normalized);
        $upper = Str::upper($normalized);
        $ucFirst = Str::ucfirst($lower);
        $title = Str::title(str_replace('_', ' ', $lower));
        $snakeFromTitle = str_replace(' ', '_', Str::lower($title));
        $compactTitle = str_replace(' ', '', $title);

        $curly = [
            '{{'.$normalized.'}}',
            '{{'.$lower.'}}',
            '{{'.$upper.'}}',
            '{{'.$ucFirst.'}}',
            '{{ '.$normalized.' }}',
            '{{ '.$lower.' }}',
            '{{ '.$upper.' }}',
            '{{ '.$ucFirst.' }}',
            '{{'.$snakeFromTitle.'}}',
            '{{ '.$snakeFromTitle.' }}',
        ];

        $bracket = [
            '['.$normalized.']',
            '['.$lower.']',
            '['.$upper.']',
            '['.$ucFirst.']',
            '['.$title.']',
            '['.$compactTitle.']',
            '['.$snakeFromTitle.']',
        ];

        $percent = [
            '%'.$normalized.'%',
            '%'.$lower.'%',
            '%'.$upper.'%',
        ];

        return array_unique(array_merge($curly, $bracket, $percent));
    }

    /**
     * Replace placeholders in the given content string.
     */
    private function applyReplacements(string $content, array $replacements): string
    {
        if ($content === '') {
            return $content;
        }

        return strtr($content, $replacements);
    }

    /**
     * Attempt to resolve the public URL for the configured admin logo.
     */
    private function resolveLogoUrl(): ?string
    {
        $settings = AdminSettings::first();

        if (! $settings || empty($settings->logo)) {
            return null;
        }

        $storedValue = ltrim((string) $settings->logo, '/');

        if (filter_var($storedValue, FILTER_VALIDATE_URL)) {
            return $storedValue;
        }

        $candidatePaths = [$storedValue];

        if (Str::startsWith($storedValue, 'storage/')) {
            $candidatePaths[] = Str::after($storedValue, 'storage/');
        }

        if (Str::startsWith($storedValue, 'public/')) {
            $candidatePaths[] = Str::after($storedValue, 'public/');
        }

        foreach ($candidatePaths as $path) {
            $path = ltrim($path, '/');

            if (Storage::disk('public')->exists($path)) {
                return Storage::disk('public')->url($path);
            }

            if (Storage::exists($path)) {
                return Storage::url($path);
            }

            $publicPath = public_path($path);
            if (is_file($publicPath)) {
                $appUrl = rtrim((string) config('app.url'), '/');
                if ($appUrl !== '') {
                    return $appUrl . '/' . $path;
                }
            }
        }

        return null;
    }

    /**
     * Normalize button data to ensure required keys exist.
     *
     * @param  mixed  $button
     * @return array<string, string>|null
     */
    private function normalizeButtonOption(mixed $button): ?array
    {
        if (is_array($button)) {
            $label = Arr::get($button, 'label');
            $url = Arr::get($button, 'url');

            if (is_string($label) && trim($label) !== '' && is_string($url) && trim($url) !== '') {
                return [
                    'label' => $label,
                    'url' => $url,
                ];
            }
        }

        return null;
    }
}


