<?php

namespace App\Models\Traits;

use App\Services\TranslationService;
use Illuminate\Support\Facades\App;

trait Translatable
{
    /**
     * Get translated attribute value
     */
    public function getTranslated(string $field, ?string $language = null): ?string
    {
        $language = $language ?? $this->getCurrentLanguage();
        
        // Get source text - use getAttribute for loaded models
        $sourceText = $this->getAttribute($field);
        
        if ($language === 'en' || empty($sourceText)) {
            return $sourceText;
        }

        $translationService = App::make(TranslationService::class);
        
        return $translationService->translate(
            static::class,
            $this->id,
            $field,
            $sourceText,
            $language,
            'en'
        ) ?? $sourceText;
    }

    /**
     * Get current language from request or default to 'en'
     */
    protected function getCurrentLanguage(): string
    {
        $request = request();
        $language = $request->header('Accept-Language') 
            ?? $request->query('lang') 
            ?? $request->input('language')
            ?? 'en';

        // Extract language code (e.g., 'sv-SE' -> 'sv')
        $language = strtolower(explode('-', $language)[0]);
        
        // Validate against supported languages
        $supported = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'];
        return in_array($language, $supported) ? $language : 'en';
    }

    /**
     * Get all translated attributes for a model
     */
    public function getTranslatedAttributes(?string $language = null): array
    {
        $language = $language ?? $this->getCurrentLanguage();
        $translatableFields = $this->getTranslatableFields();
        $result = [];

        foreach ($translatableFields as $field) {
            $result[$field] = $this->getTranslated($field, $language);
        }

        return $result;
    }

    /**
     * Define which fields are translatable
     * Override this method in your model
     */
    protected function getTranslatableFields(): array
    {
        return [];
    }

    /**
     * Boot the trait and add observers for automatic translation invalidation
     */
    protected static function bootTranslatable(): void
    {
        static::saved(function ($model) {
            $translatableFields = $model->getTranslatableFields();
            $translationService = App::make(TranslationService::class);

            foreach ($translatableFields as $field) {
                if ($model->wasChanged($field)) {
                    $translationService->invalidateTranslations(
                        static::class,
                        $model->id,
                        $field
                    );
                }
            }
        });
    }
}

