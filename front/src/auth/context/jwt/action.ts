import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export type SignInParams = {
  email: string;
  password: string;
  turnstileToken?: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export type SignInResult = {
  twoFactorRequired: boolean;
  method?: 'email' | 'app';
  email?: string;
};

/** **************************************
 * Sign in (Sanctum session)
 *************************************** */
export const signInWithPassword = async ({
  email,
  password,
  turnstileToken,
}: SignInParams): Promise<SignInResult> => {
  try {
    await initSanctumCsrf();
    const payload: any = { email, password };
    
    // Always include turnstile_token if provided, even if empty string
    // This ensures the backend validation works correctly
    if (turnstileToken !== undefined && turnstileToken !== null) {
      payload.turnstile_token = turnstileToken;
    }
    
    const res = await sanctum.post('/api/v1/auth/login', payload);
    
    // The axios interceptor unwraps the response envelope, so res.data is already the inner data object
    // Backend returns: { status: true, message: "...", data: { two_factor_required: true, ... } }
    // After interceptor: res.data = { two_factor_required: true, two_factor_method: "email", email: "..." }
    const responseData: any = (res as any)?.data ?? null;
    
    if (responseData && responseData.two_factor_required === true) {
      
      return {
        twoFactorRequired: true,
        method: responseData.two_factor_method || 'email',
        email: responseData.email || email,
      };
    }

    return { twoFactorRequired: false };
  } catch (error) {
    console.error('❌ Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({
  email,
  password,
  firstName,
  lastName,
}: SignUpParams): Promise<void> => {
  // Not implemented; out of scope for current task
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  try {
    // Set flag to prevent auto-login on refresh
    sessionStorage.setItem('logout_in_progress', 'true');
    
    await sanctum.post('/api/v1/auth/logout');
    
    // Clear the flag after successful logout
    setTimeout(() => {
      sessionStorage.removeItem('logout_in_progress');
    }, 1000);
  } catch (error) {
    console.error('Error during sign out:', error);
    // Still clear the flag even on error
    setTimeout(() => {
      sessionStorage.removeItem('logout_in_progress');
    }, 1000);
    throw error;
  }
};
