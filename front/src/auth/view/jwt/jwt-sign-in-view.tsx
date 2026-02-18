import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { getTurnstileSiteKey, shouldEnableTurnstile } from 'src/utils/turnstile-config';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import { endpoints, default as axiosInstance } from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';
import { Turnstile } from 'src/components/turnstile';
import { Form, Field, schemaUtils } from 'src/components/hook-form';

import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

const TURNSTILE_SITE_KEY = getTurnstileSiteKey();

export function JwtSignInView() {
  const { t } = useTranslate('messages');
  const router = useRouter();
  const searchParams = useSearchParams();

  const showPassword = useBoolean();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [resendSuccessMessage, setResendSuccessMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Check for email verification status from query parameter
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === '1') {
      setVerificationMessage(t('signIn.emailVerified'));
      // Clear the query parameter from URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('verified');
      const newUrl = window.location.pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    } else if (verified === '0') {
      setErrorMessage(t('signIn.emailVerificationFailed'));
      // Clear the query parameter from URL
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('verified');
      const newUrl = window.location.pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, t]);

  const createSignInSchema = () =>
    z.object({
      email: schemaUtils.email(),
      password: z
        .string()
        .min(1, { message: t('signIn.validation.passwordRequired') })
        .min(8, { message: t('signIn.validation.passwordMinLength') }),
    });

  const SignInSchema = createSignInSchema();
  type SignInSchemaType = z.infer<typeof SignInSchema>;

  const defaultValues: SignInSchemaType = {
    email: '', // Don't pre-fill with demo account
    password: '', // Don't pre-fill with demo account
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    watch,
  } = methods;

  const emailValue = watch('email');
  
  

  const onSubmit = handleSubmit(
    async (data) => {
      try {
        setErrorMessage(null);
        setResendSuccessMessage(null);

        // Clear any existing session before login
        sessionStorage.removeItem('jwt_access_token');
        
        // Ensure turnstileToken is properly passed
        const finalTurnstileToken = shouldEnableTurnstile() ? turnstileToken : undefined;
        
        // Validate Turnstile token before submission
        if (shouldEnableTurnstile()) {
          if (!finalTurnstileToken) {
            setErrorMessage('Security verification is required. Please complete the verification.');
            return;
          }
          
          // Additional validation: ensure token is not empty string
          if (finalTurnstileToken.trim() === '') {
            setErrorMessage('Security verification token is invalid. Please refresh and try again.');
            setTurnstileToken(null); // Reset to trigger new verification
            return;
          }
        }
        
        const result = await signInWithPassword({ 
          email: data.email, 
          password: data.password,
          turnstileToken: finalTurnstileToken ?? undefined,
        });

        if (result.twoFactorRequired) {
          const params = new URLSearchParams();
          if (result.email) params.set('email', result.email);
          if (result.method) params.set('method', result.method);
          router.replace(`/auth/two-factor?${params.toString()}`);
          return;
        }

        // Set a flag to indicate we just logged in
        // This will help the auth provider check the session immediately after redirect
        sessionStorage.setItem('just_logged_in', 'true');

        // Small delay to ensure session is fully established before redirect
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use window.location for reliable redirect after login
        // This ensures the page fully reloads and the auth state is properly set
        window.location.href = CONFIG.auth.redirectPath;
      } catch (error: any) {
        console.error('❌ Login error details:', {
          error,
          message: error?.message,
          response: error?.response,
          responseData: error?.response?.data,
          httpStatus: error?.httpStatus,
          errors: error?.errors,
        });
        
        const feedbackMessage = getErrorMessage(error);
        console.error('❌ Login error message:', feedbackMessage);
        setErrorMessage(feedbackMessage);
        
        // Reset Turnstile on error to allow retry
        setTurnstileToken(null);
      }
    },
    (validationErrors) => {
      // Handle validation errors
      console.error('❌ Form validation failed:', validationErrors);
      setErrorMessage('Please check your input and try again.');
    }
  );

  const handleResendVerificationEmail = async () => {
    if (!emailValue) {
      setErrorMessage(t('signIn.emailAddress') + ' is required to resend verification email.');
      return;
    }

    try {
      setIsResending(true);
      setResendSuccessMessage(null);
      setErrorMessage(null);

      const response = await axiosInstance.post(endpoints.auth.resendVerificationEmail, {
        email: emailValue,
      });

      const message = (response as any)?.message || t('signIn.verificationEmailSent');
      setResendSuccessMessage(message);
    } catch (error: any) {
      console.error('❌ Resend verification email error:', error);
      const errorMsg = error?.response?.data?.message || error?.message || t('signIn.verificationEmailError');
      setErrorMessage(errorMsg);
      setResendSuccessMessage(null);
    } finally {
      setIsResending(false);
    }
  };

  const isEmailNotVerified = errorMessage?.toLowerCase().includes('email not verified');

  // Removed demo accounts autofill to allow manual credential entry only

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label={t('signIn.emailAddress')}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: { placeholder: t('signIn.emailPlaceholder') },
        }}
      />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href={paths.auth.forgotPassword}
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          {t('signIn.forgotPassword')}
        </Link>

        <Field.Text
          name="password"
          label={t('signIn.password')}
          placeholder={t('signIn.passwordPlaceholder')}
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {shouldEnableTurnstile() && (
        <Turnstile
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={(token) => {
            setTurnstileToken(token);
            // Clear any previous error messages when Turnstile succeeds
            if (errorMessage?.includes('Security verification')) {
              setErrorMessage(null);
            }
          }}
          onError={() => {
            console.error('❌ Turnstile verification error');
            setTurnstileToken(null);
            setErrorMessage('Security verification failed. Please refresh and try again.');
          }}
          onExpire={() => {
            console.warn('⚠️ Turnstile token expired');
            setTurnstileToken(null);
            setErrorMessage('Security verification expired. Please verify again.');
          }}
          theme="auto"
          size="normal"
        />
      )}

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('signIn.signingIn')}
        disabled={isSubmitting || (shouldEnableTurnstile() && !turnstileToken)}
        onClick={(e) => {
          const isDisabled = isSubmitting || (shouldEnableTurnstile() && !turnstileToken);
          
          if (isDisabled) {
            if (shouldEnableTurnstile() && !turnstileToken) {
              setErrorMessage('Security verification is required. Please complete the verification.');
            }
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
          return undefined;
        }}
      >
        {t('signIn.signInButton')}
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title={t('signIn.title')}
        description={
          <>
            {`${t('signIn.description')} `}
            <Link component={RouterLink} href={paths.signUp} variant="subtitle2">
              {t('signIn.getStarted')}
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!verificationMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {verificationMessage}
        </Alert>
      )}

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
          {isEmailNotVerified && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResendVerificationEmail}
                disabled={isResending || !emailValue}
                loading={isResending}
                loadingIndicator={t('signIn.resendingVerificationEmail')}
              >
                {t('signIn.resendVerificationEmail')}
              </Button>
            </Box>
          )}
        </Alert>
      )}

      {!!resendSuccessMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {resendSuccessMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );
}
