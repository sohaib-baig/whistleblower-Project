import { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export interface StripeConfigurationFormValues {
  clientId: string;
  secretKey: string;
  productKey: string;
}

export interface StripeConfigurationData {
  stripe_client_id: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
}

// ----------------------------------------------------------------------

/**
 * Get Stripe configuration from API
 */
export async function getStripeConfiguration(): Promise<StripeConfigurationFormValues | null> {
  try {
    const response = await sanctum.get(endpoints.stripeConfiguration.get);

    // NOTE: axios-sanctum normalizes the envelope and sets response.data to the actual data
    const data: any = response.data || {};

    return {
      clientId: data.stripe_client_id || '',
      secretKey: data.stripe_secret_key || '',
      productKey: data.stripe_webhook_secret || '',
    };
  } catch (error) {
    console.error('Failed to fetch Stripe configuration:', error);
    throw error;
  }
}

/**
 * Save Stripe configuration to API
 */
export async function saveStripeConfiguration(data: StripeConfigurationFormValues): Promise<void> {
  try {
    await initSanctumCsrf();

    // Map frontend data to API format
    const apiData: Partial<StripeConfigurationData> = {
      stripe_client_id: data.clientId,
      stripe_secret_key: data.secretKey,
      stripe_webhook_secret: data.productKey,
    };

    // axios-sanctum will throw on non-2xx or error envelopes; success implies save worked
    await sanctum.put(endpoints.stripeConfiguration.update, apiData);
  } catch (error) {
    console.error('Failed to save Stripe configuration:', error);
    throw error;
  }
}

/**
 * Test Stripe connection
 * Note: This is a client-side validation. For production,
 * you should implement a server-side endpoint to test the connection.
 */
export async function testStripeConnection(data: StripeConfigurationFormValues): Promise<boolean> {
  try {
    // Basic validation
    if (!data.clientId || !data.secretKey || !data.productKey) {
      return false;
    }

    // Check if keys have the correct format
    const isClientIdValid = data.clientId.startsWith('pk_');
    const isSecretKeyValid = data.secretKey.startsWith('sk_');
    const isProductKeyValid =
      data.productKey.startsWith('prod_') || data.productKey.startsWith('whsec_');

    return isClientIdValid && isSecretKeyValid && isProductKeyValid;
  } catch (error) {
    console.error('Stripe connection test failed:', error);
    return false;
  }
}
