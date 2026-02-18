import type { InitOptions } from 'i18next';
import type { Theme, Components } from '@mui/material/styles';

import resourcesToBackend from 'i18next-resources-to-backend';

// MUI Core Locales
import {
  enUS as enUSCore,
  frFR as frFRCore,
  deDE as deDECore,
  svSE as svSECore,
  daDK as daDKCore,
  fiFI as fiFICore,
  nbNO as nbNOCore,
} from '@mui/material/locale';
// MUI Date Pickers Locales
import {
  enUS as enUSDate,
  frFR as frFRDate,
  deDE as deDEDate,
  svSE as svSEDate,
  daDK as daDKDate,
  fiFI as fiFIDate,
  nbNO as nbNODate,
} from '@mui/x-date-pickers/locales';
// MUI Data Grid Locales
import {
  enUS as enUSDataGrid,
  frFR as frFRDataGrid,
  deDE as deDEDataGrid,
  svSE as svSEDataGrid,
  daDK as daDKDataGrid,
  fiFI as fiFIDataGrid,
  nbNO as nbNODataGrid,
} from '@mui/x-data-grid/locales';

// ----------------------------------------------------------------------

// Supported languages
export const supportedLngs = ['en', 'sv', 'no', 'da', 'fi', 'de', 'fr'] as const;
export type LangCode = (typeof supportedLngs)[number];

// Fallback and default namespace
export const fallbackLng: LangCode = 'en';
export const defaultNS = 'common';

// Storage config
export const storageConfig = {
  cookie: { key: 'i18next', autoDetection: false },
  localStorage: { key: 'i18nextLng', autoDetection: false },
} as const;

// ----------------------------------------------------------------------

/**
 * @countryCode https://flagcdn.com/en/codes.json
 * @adapterLocale https://github.com/iamkun/dayjs/tree/master/src/locale
 * @numberFormat https://simplelocalize.io/data/locales/
 */

export type LangOption = {
  value: LangCode;
  label: string;
  countryCode: string;
  adapterLocale?: string;
  numberFormat: { code: string; currency: string };
  systemValue?: { components: Components<Theme> };
};

export const allLangs: LangOption[] = [
  {
    value: 'en',
    label: 'English',
    countryCode: 'GB',
    adapterLocale: 'en',
    numberFormat: { code: 'en-US', currency: 'USD' },
    systemValue: {
      components: { ...enUSCore.components, ...enUSDate.components, ...enUSDataGrid.components },
    },
  },
  {
    value: 'sv',
    label: 'Swedish',
    countryCode: 'SE',
    adapterLocale: 'sv',
    numberFormat: { code: 'sv-SE', currency: 'SEK' },
    systemValue: {
      components: { ...svSECore.components, ...svSEDate.components, ...svSEDataGrid.components },
    },
  },
  {
    value: 'no',
    label: 'Norwegian',
    countryCode: 'NO',
    adapterLocale: 'nb',
    numberFormat: { code: 'nb-NO', currency: 'NOK' },
    systemValue: {
      components: { ...nbNOCore.components, ...nbNODate.components, ...nbNODataGrid.components },
    },
  },
  {
    value: 'da',
    label: 'Danish',
    countryCode: 'DK',
    adapterLocale: 'da',
    numberFormat: { code: 'da-DK', currency: 'DKK' },
    systemValue: {
      components: { ...daDKCore.components, ...daDKDate.components, ...daDKDataGrid.components },
    },
  },
  {
    value: 'fi',
    label: 'Finnish',
    countryCode: 'FI',
    adapterLocale: 'fi',
    numberFormat: { code: 'fi-FI', currency: 'EUR' },
    systemValue: {
      components: { ...fiFICore.components, ...fiFIDate.components, ...fiFIDataGrid.components },
    },
  },
  {
    value: 'de',
    label: 'German',
    countryCode: 'DE',
    adapterLocale: 'de',
    numberFormat: { code: 'de-DE', currency: 'EUR' },
    systemValue: {
      components: { ...deDECore.components, ...deDEDate.components, ...deDEDataGrid.components },
    },
  },
  {
    value: 'fr',
    label: 'French',
    countryCode: 'FR',
    adapterLocale: 'fr',
    numberFormat: { code: 'fr-FR', currency: 'EUR' },
    systemValue: {
      components: { ...frFRCore.components, ...frFRDate.components, ...frFRDataGrid.components },
    },
  },
];

// ----------------------------------------------------------------------

export const i18nResourceLoader = resourcesToBackend(
  (lang: LangCode, namespace: string) => import(`./langs/${lang}/${namespace}.json`)
);

export function i18nOptions(lang = fallbackLng, namespace = defaultNS): InitOptions {
  return {
    // debug: true,
    supportedLngs,
    fallbackLng,
    lng: lang,
    /********/
    fallbackNS: defaultNS,
    defaultNS,
    ns: namespace,
  };
}

export function getCurrentLang(lang?: string): LangOption {
  const fallbackLang = allLangs.find((l) => l.value === fallbackLng) ?? allLangs[0];

  if (!lang) {
    return fallbackLang;
  }

  return allLangs.find((l) => l.value === lang) ?? fallbackLang;
}

/**
 * Detect browser language and match it against supported languages
 * Returns a supported language code or fallback to English
 */
export function detectBrowserLanguage(): LangCode {
  // Get browser language(s)
  const browserLanguages = navigator.languages || [navigator.language];
  
  // Try to match each browser language against supported languages
  for (const browserLang of browserLanguages) {
    // Extract language code (e.g., 'sv-SE' -> 'sv', 'sv' -> 'sv')
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Check if it's a supported language
    if (supportedLngs.includes(langCode as LangCode)) {
      return langCode as LangCode;
    }
  }
  
  // Fallback to English if no match
  return fallbackLng;
}
