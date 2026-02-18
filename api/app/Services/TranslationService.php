<?php

namespace App\Services;

use App\Models\Translation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class TranslationService
{
    private ?string $apiKey;
    private string $apiUrl = 'https://www.googleapis.com/language/translate/v2';

    public function __construct()
    {
        $apiKey = config('services.google_translate.api_key');
        $this->apiKey = $apiKey ? (string) $apiKey : null;
        
        if (empty($this->apiKey)) {
            Log::warning('Google Translate API key not configured');
        }
    }

    /**
     * Get translated text for a model field
     * 
     * @param string $modelClass The model class (e.g., 'App\Models\Page')
     * @param string $modelId The model ID
     * @param string $field The field name (e.g., 'page_title', 'page_content')
     * @param string $sourceText The source text to translate
     * @param string $targetLanguage Target language code (e.g., 'sv', 'en')
     * @param string|null $sourceLanguage Source language code (default: 'en')
     * @return string|null Translated text or null if translation fails
     */
    public function translate(
        string $modelClass,
        string $modelId,
        string $field,
        string $sourceText,
        string $targetLanguage,
        ?string $sourceLanguage = 'en'
    ): ?string {
        // If target language is same as source, return original
        if ($targetLanguage === $sourceLanguage) {
            return $sourceText;
        }

        // Validate language codes
        if (!in_array($targetLanguage, Translation::supportedLanguages())) {
            Log::warning("Unsupported target language: {$targetLanguage}");
            return $sourceText;
        }

        // Generate hash for caching
        $sourceHash = md5($sourceText);
        
        // Check cache first
        $cacheKey = "translation:{$modelClass}:{$modelId}:{$field}:{$targetLanguage}:{$sourceHash}";
        
        $cached = Cache::remember($cacheKey, now()->addDays(30), function () use ($modelClass, $modelId, $field, $sourceText, $targetLanguage, $sourceLanguage, $sourceHash) {
            // Check database cache
            $translation = Translation::where('translatable_type', $modelClass)
                ->where('translatable_id', $modelId)
                ->where('translatable_field', $field)
                ->where('language', $targetLanguage)
                ->where('source_text_hash', $sourceHash)
                ->first();

            if ($translation) {
                return $translation->translated_text;
            }

            // If not in cache, translate via API
            $translatedText = $this->translateViaApi($sourceText, $targetLanguage, $sourceLanguage);
            
            if ($translatedText) {
                // Store in database
                Translation::updateOrCreate(
                    [
                        'translatable_type' => $modelClass,
                        'translatable_id' => $modelId,
                        'translatable_field' => $field,
                        'language' => $targetLanguage,
                    ],
                    [
                        'translated_text' => $translatedText,
                        'source_text_hash' => $sourceHash,
                    ]
                );
            }

            return $translatedText;
        });

        return $cached ?: $sourceText;
    }

    /**
     * Translate text using Google Translate API
     * Handles large content by splitting into chunks
     * For HTML content, only translates text while preserving structure
     */
    private function translateViaApi(string $text, string $targetLanguage, string $sourceLanguage = 'en'): ?string
    {
        if (empty($this->apiKey)) {
            Log::error('Google Translate API key not configured');
            return null;
        }

        if (empty($text)) {
            return $text;
        }

        // Check if content is HTML - if so, extract and translate only text content
        if (preg_match('/<[^>]+>/', $text)) {
            return $this->translateHtmlContent($text, $targetLanguage, $sourceLanguage);
        }

        // Plain text - translate directly
        // Google Translate API limit: ~5000 characters per request
        // Split large content into chunks
        $maxChunkSize = 4500; // Slightly less to be safe
        $textLength = mb_strlen($text);

        if ($textLength <= $maxChunkSize) {
            // Small content - translate directly
            return $this->translateChunk($text, $targetLanguage, $sourceLanguage);
        }

        // Large content - split into chunks
        $chunks = $this->splitIntoChunks($text, $maxChunkSize);
        $translatedChunks = [];

        foreach ($chunks as $chunk) {
            $translatedChunk = $this->translateChunk($chunk, $targetLanguage, $sourceLanguage);
            if ($translatedChunk === null) {
                Log::error('Failed to translate chunk', [
                    'chunk_length' => mb_strlen($chunk),
                    'target_language' => $targetLanguage,
                ]);
                // Return original chunk if translation fails
                $translatedChunk = $chunk;
            }
            $translatedChunks[] = $translatedChunk;
        }

        return implode('', $translatedChunks);
    }

    /**
     * Translate HTML content while preserving structure and attributes
     * Protects images, data URLs, and attributes from translation
     */
    private function translateHtmlContent(string $html, string $targetLanguage, string $sourceLanguage = 'en'): ?string
    {
        // Protect all HTML attributes and embedded data from translation
        $placeholders = [];
        $placeholderIndex = 0;
        
        // Step 1: Protect all tag attributes (src, href, alt, data-*, etc.)
        $html = preg_replace_callback(
            '/<([a-z][a-z0-9]*)[^>]*>/i',
            function ($matches) use (&$placeholders, &$placeholderIndex) {
                $tag = $matches[0];
                // Protect all attributes
                $protectedTag = preg_replace_callback(
                    '/(\w+)=["\']([^"\']+)["\']/i',
                    function ($attrMatches) use (&$placeholders, &$placeholderIndex) {
                        $attrName = $attrMatches[1];
                        $attrValue = $attrMatches[2];
                        
                        // Always protect these attributes
                        if (in_array(strtolower($attrName), ['src', 'href', 'data-src', 'data-href', 'alt', 'title']) ||
                            strpos(strtolower($attrValue), 'data:') === 0 ||
                            strpos(strtolower($attrValue), 'base64') !== false ||
                            strlen($attrValue) > 100) {
                            $placeholder = '___ATTR_' . $placeholderIndex . '___';
                            $placeholders[$placeholder] = $attrValue;
                            $placeholderIndex++;
                            return $attrName . '="' . $placeholder . '"';
                        }
                        return $attrMatches[0];
                    },
                    $tag
                );
                return $protectedTag;
            },
            $html
        );

        // Step 2: Protect long base64-like strings that might appear as text content
        $html = preg_replace_callback(
            '#>([A-Za-z0-9+/=\s]{100,})<#',
            function ($matches) use (&$placeholders, &$placeholderIndex) {
                $text = $matches[1];
                // If it looks like base64 or encoded data, protect it
                if (preg_match('#^[A-Za-z0-9+/=\s]+$#', $text) && 
                    (strlen($text) > 200 || substr_count($text, '=') > 10)) {
                    $placeholder = '___DATA_' . $placeholderIndex . '___';
                    $placeholders[$placeholder] = $text;
                    $placeholderIndex++;
                    return '>' . $placeholder . '<';
                }
                return $matches[0];
            },
            $html
        );

        // Step 3: Translate the HTML (Google Translate will preserve tags but translate text)
        $translatedHtml = $this->translateChunk($html, $targetLanguage, $sourceLanguage);
        
        if ($translatedHtml === null) {
            return null;
        }

        // Step 4: Restore all placeholders
        foreach ($placeholders as $placeholder => $original) {
            $translatedHtml = str_replace($placeholder, $original, $translatedHtml);
        }

        return $translatedHtml;
    }

    /**
     * Translate a single chunk of text
     */
    private function translateChunk(string $text, string $targetLanguage, string $sourceLanguage = 'en'): ?string
    {
        try {
            // Google Translate API v2 requires API key as query parameter
            // Use POST for better handling of large content, but key goes in URL
            // Note: $this->apiKey is guaranteed to be non-null here due to check in translateViaApi()
            $apiKeyString = $this->apiKey ?? '';
            $response = Http::timeout(30)->asForm()->post($this->apiUrl . '?key=' . urlencode($apiKeyString), [
                'q' => $text,
                'source' => $sourceLanguage,
                'target' => $targetLanguage,
                'format' => 'html', // Preserve HTML formatting
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['data']['translations'][0]['translatedText'])) {
                    return $data['data']['translations'][0]['translatedText'];
                }
            }

            Log::error('Google Translate API error', [
                'status' => $response->status(),
                'response' => substr($response->body(), 0, 500), // Log first 500 chars only
                'text_length' => mb_strlen($text),
            ]);
        } catch (\Exception $e) {
            Log::error('Translation API exception', [
                'message' => $e->getMessage(),
                'text_length' => mb_strlen($text),
            ]);
        }

        return null;
    }

    /**
     * Split text into chunks while preserving HTML tags
     * Tries to split at sentence boundaries when possible
     */
    private function splitIntoChunks(string $text, int $maxChunkSize): array
    {
        $chunks = [];
        $textLength = mb_strlen($text);

        if ($textLength <= $maxChunkSize) {
            return [$text];
        }

        $currentPos = 0;
        
        while ($currentPos < $textLength) {
            $remaining = $textLength - $currentPos;
            $chunkSize = min($maxChunkSize, $remaining);
            
            // Try to find a good split point (sentence end, paragraph end, or tag boundary)
            $chunk = mb_substr($text, $currentPos, $chunkSize);
            
            // If not at the end, try to find a better split point
            if ($currentPos + $chunkSize < $textLength) {
                // Look for sentence end (.</p>, </h1>, </h2>, etc.)
                $bestPos = $currentPos + $chunkSize;
                
                // Check next 500 characters for a good split point
                $lookAhead = mb_substr($text, $currentPos + $chunkSize, 500);
                if (preg_match('/<\/(p|h[1-6]|div|li|section)>/i', $lookAhead, $matches, PREG_OFFSET_CAPTURE)) {
                    $bestPos = $currentPos + $chunkSize + $matches[0][1] + mb_strlen($matches[0][0]);
                } elseif (preg_match('/<\/[^>]+>/', $lookAhead, $matches, PREG_OFFSET_CAPTURE)) {
                    // Any closing tag
                    $bestPos = $currentPos + $chunkSize + $matches[0][1] + mb_strlen($matches[0][0]);
                }
                
                $chunk = mb_substr($text, $currentPos, $bestPos - $currentPos);
                $currentPos = $bestPos;
            } else {
                $currentPos += $chunkSize;
            }
            
            $chunks[] = $chunk;
        }

        return $chunks;
    }

    /**
     * Invalidate translations for a specific model/field when source content changes
     */
    public function invalidateTranslations(string $modelClass, string $modelId, string $field): void
    {
        // Delete old translations with different hash
        Translation::where('translatable_type', $modelClass)
            ->where('translatable_id', $modelId)
            ->where('translatable_field', $field)
            ->delete();

        // Clear cache
        $cachePrefix = "translation:{$modelClass}:{$modelId}:{$field}:";
        Cache::flush(); // Simple approach - in production, use more targeted cache clearing
    }

    /**
     * Batch translate multiple fields
     */
    public function translateFields(
        string $modelClass,
        string $modelId,
        array $fields,
        string $targetLanguage,
        ?string $sourceLanguage = 'en'
    ): array {
        $result = [];
        
        foreach ($fields as $field => $sourceText) {
            $result[$field] = $this->translate(
                $modelClass,
                $modelId,
                $field,
                $sourceText,
                $targetLanguage,
                $sourceLanguage
            );
        }

        return $result;
    }

    /**
     * Get all translations for a model in a specific language
     */
    public function getTranslations(string $modelClass, string $modelId, string $language): array
    {
        return Translation::where('translatable_type', $modelClass)
            ->where('translatable_id', $modelId)
            ->where('language', $language)
            ->pluck('translated_text', 'translatable_field')
            ->toArray();
    }

    /**
     * Translate text while protecting email template placeholders
     * Protects placeholders in formats: [Placeholder] and {{Placeholder}}
     * 
     * @param string $text The text to translate
     * @param string $targetLanguage Target language code
     * @param string $sourceLanguage Source language code (default: 'en')
     * @return string|null Translated text with placeholders preserved, or null on failure
     */
    public function translateWithPlaceholderProtection(
        string $text,
        string $targetLanguage,
        string $sourceLanguage = 'en'
    ): ?string {
        if (empty($text)) {
            return $text;
        }

        // If target language is same as source, return original
        if ($targetLanguage === $sourceLanguage) {
            return $text;
        }

        // Validate language codes
        if (!in_array($targetLanguage, Translation::supportedLanguages())) {
            Log::warning("Unsupported target language: {$targetLanguage}");
            return $text;
        }

        // Step 1: Protect placeholders in format [Placeholder] and {{Placeholder}}
        $placeholders = [];
        $placeholderIndex = 0;
        
        // Protect [Placeholder] format
        $text = preg_replace_callback(
            '/\[([^\]]+)\]/',
            function ($matches) use (&$placeholders, &$placeholderIndex) {
                $placeholder = '___BRACKET_PLACEHOLDER_' . $placeholderIndex . '___';
                $placeholders[$placeholder] = $matches[0]; // Store the full match including brackets
                $placeholderIndex++;
                return $placeholder;
            },
            $text
        );

        // Protect {{Placeholder}} format
        $text = preg_replace_callback(
            '/\{\{([^}]+)\}\}/',
            function ($matches) use (&$placeholders, &$placeholderIndex) {
                $placeholder = '___CURLY_PLACEHOLDER_' . $placeholderIndex . '___';
                $placeholders[$placeholder] = $matches[0]; // Store the full match including braces
                $placeholderIndex++;
                return $placeholder;
            },
            $text
        );

        // Step 2: Translate the text (which may be HTML)
        $translatedText = $this->translateViaApi($text, $targetLanguage, $sourceLanguage);
        
        if ($translatedText === null) {
            return null;
        }

        // Step 3: Restore all placeholders
        foreach ($placeholders as $placeholder => $original) {
            $translatedText = str_replace($placeholder, $original, $translatedText);
        }

        return $translatedText;
    }
}

