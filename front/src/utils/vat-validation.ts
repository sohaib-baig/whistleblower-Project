/**
 * VAT number format validation patterns for EU countries
 * Based on EU VAT number formats
 */

export const VAT_FORMAT_PATTERNS: Record<string, RegExp> = {
  Austria: /^ATU\d{9}$/,
  Belgium: /^BE[0-1]\d{9}$/,
  Bulgaria: /^BG\d{9,10}$/,
  Croatia: /^HR\d{11}$/,
  Cyprus: /^CY\d{8}[A-Z]$/,
  'Czech Republic': /^CZ\d{8,10}$/,
  Denmark: /^DK\d{8}$/,
  Estonia: /^EE\d{9}$/,
  Finland: /^FI\d{8}$/,
  France: /^FR[A-HJ-NP-Z0-9]{2}\d{9}$/,
  Germany: /^DE\d{9}$/,
  Greece: /^EL\d{9}$/,
  Hungary: /^HU\d{8}$/,
  Ireland: /^IE\d[A-Z0-9+*]\d{5}[A-Z]{1,2}$/,
  Italy: /^IT\d{11}$/,
  Latvia: /^LV\d{11}$/,
  Lithuania: /^LT(\d{9}|\d{12})$/,
  Luxembourg: /^LU\d{8}$/,
  Malta: /^MT\d{8}$/,
  Netherlands: /^NL\d{9}B\d{2}$/,
  Poland: /^PL\d{10}$/,
  Portugal: /^PT\d{9}$/,
  Romania: /^RO\d{2,10}$/,
  Slovakia: /^SK\d{10}$/,
  Slovenia: /^SI\d{8}$/,
  Spain: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
};

/**
 * Validates VAT number format based on country
 * @param vatNumber - The VAT number to validate
 * @param country - The country name
 * @returns true if valid, false otherwise
 */
export function validateVATFormat(vatNumber: string, country: string): boolean {
  if (!vatNumber || !country) {
    return false;
  }

  // Remove spaces and convert to uppercase for validation
  const cleanedVAT = vatNumber.replace(/\s+/g, '').toUpperCase();
  const pattern = VAT_FORMAT_PATTERNS[country];

  if (!pattern) {
    // If no pattern exists for the country, accept any format (for non-EU countries)
    return true;
  }

  return pattern.test(cleanedVAT);
}

/**
 * Gets the expected VAT format description for a country
 * @param country - The country name
 * @returns Format description string
 */
export function getVATFormatDescription(country: string): string {
  const formats: Record<string, string> = {
    Austria: 'ATU12345678 (AT + U + 9 digits)',
    Belgium: 'BE0123456789 (BE + 10 digits)',
    Bulgaria: 'BG123456789 or BG1234567890 (BG + 9-10 digits)',
    Croatia: 'HR12345678901 (HR + 11 digits)',
    Cyprus: 'CY12345678A (CY + 8 digits + 1 letter)',
    'Czech Republic': 'CZ12345678 (CZ + 8-10 digits)',
    Denmark: 'DK12345678 (DK + 8 digits)',
    Estonia: 'EE123456789 (EE + 9 digits)',
    Finland: 'FI12345678 (FI + 8 digits)',
    France: 'FRAB123456789 (FR + 2 chars + 9 digits)',
    Germany: 'DE123456789 (DE + 9 digits)',
    Greece: 'EL123456789 (EL + 9 digits)',
    Hungary: 'HU12345678 (HU + 8 digits)',
    Ireland: 'IE1234567A or IE1A23456B (IE + 7-8 chars)',
    Italy: 'IT12345678901 (IT + 11 digits)',
    Latvia: 'LV12345678901 (LV + 11 digits)',
    Lithuania: 'LT123456789 or LT123456789012 (LT + 9 or 12 digits)',
    Luxembourg: 'LU12345678 (LU + 8 digits)',
    Malta: 'MT12345678 (MT + 8 digits)',
    Netherlands: 'NL123456789B01 (NL + 9 digits + B + 2 digits)',
    Poland: 'PL1234567890 (PL + 10 digits)',
    Portugal: 'PT123456789 (PT + 9 digits)',
    Romania: 'RO1234567890 (RO + 2-10 digits)',
    Slovakia: 'SK1234567890 (SK + 10 digits)',
    Slovenia: 'SI12345678 (SI + 8 digits)',
    Spain: 'ESA12345674 or ES12345678Z (ES + 9 chars)',
  };

  return formats[country] || 'Please enter a valid VAT number';
}









