/**
 * Turnstile configuration utility
 * 
 * Determines if Turnstile should be enabled based on environment and configuration.
 * Can be forced enabled in local for testing purposes.
 */

/**
 * Check if Turnstile should be enabled
 * 
 * @returns true if Turnstile should be shown/required, false otherwise
 */
// Cache the result to avoid recalculating on every call
let cachedResult: boolean | null = null;
let cachedHostname: string | null = null;

export function shouldEnableTurnstile(): boolean {
  // Check if hostname changed (e.g., navigation)
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : null;
  if (cachedResult !== null && cachedHostname === currentHostname) {
    return cachedResult;
  }
  
  // Check if explicitly enabled via environment variable (for local testing)
  // Support both 'true' string and '1' number/string
  const forceEnableValue = import.meta.env.VITE_TURNSTILE_FORCE_ENABLE;
  const forceEnable = forceEnableValue === 'true' || forceEnableValue === '1' || forceEnableValue === 1;
  
  // Check if we're in local/development environment
  const isLocalEnv = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  // Check if running on localhost/127.0.0.1 (user has configured this in Cloudflare)
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.0.')
  );
  
  // Calculate result
  const result = forceEnable || isLocalhost || !isLocalEnv;
  
  // Cache the result
  cachedResult = result;
  cachedHostname = currentHostname;
  
  // Enable Turnstile if:
  // 1. Force enabled via env var, OR
  // 2. Running on localhost/127.0.0.1 (user configured this in Cloudflare), OR
  // 3. Not in local environment (production/staging)
  return result;
}

/**
 * Get Turnstile site key from environment or use default
 */
export function getTurnstileSiteKey(): string {
  return import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAACI2ghJGyWWGChrA';
}

