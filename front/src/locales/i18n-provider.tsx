import type { InitOptions } from 'i18next';
import type { LangCode } from './locales-config';

import i18next from 'i18next';
import { getStorage } from 'minimal-shared/utils';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next, I18nextProvider as Provider } from 'react-i18next';

import { 
  i18nOptions, 
  storageConfig, 
  supportedLngs,
  i18nResourceLoader, 
  detectBrowserLanguage 
} from './locales-config';

// ----------------------------------------------------------------------

// Check if user has manually selected a language (stored in localStorage)
const storedLang = getStorage(
  storageConfig.localStorage.key,
  undefined
) as LangCode | undefined;

// Determine initial language:
// 1. Use stored language if user has manually selected one
// 2. Otherwise, detect browser language and match against supported languages
// 3. Fall back to English if browser language is not supported
let i18nextLng: LangCode;
if (storedLang && supportedLngs.includes(storedLang)) {
  // User has manually selected a language, use it
  i18nextLng = storedLang;
} else {
  // No stored language, detect from browser
  i18nextLng = detectBrowserLanguage();
}

/**
 * Initialize i18next
 */
const initOptions: InitOptions = {
  ...i18nOptions(i18nextLng),
  detection: {
    // Order of detection: localStorage first (user preference), then browser language
    order: ['localStorage', 'navigator'],
    // Cache the detected language in localStorage
    caches: ['localStorage'],
    // Only use supported languages
    lookupLocalStorage: storageConfig.localStorage.key,
  },
};

i18next.use(LanguageDetector).use(initReactI18next).use(i18nResourceLoader).init(initOptions);

// ----------------------------------------------------------------------

type I18nProviderProps = {
  children: React.ReactNode;
};

export function I18nProvider({ children }: I18nProviderProps) {
  return <Provider i18n={i18next}>{children}</Provider>;
}
