import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';

import { validateVATFormat } from 'src/utils/vat-validation';

import { useTranslate } from 'src/locales';
import axios, { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

import { Form, schemaUtils } from 'src/components/hook-form';

import {
  SignupStepper,
  SignupStepOne,
  SignupStepTwo,
  SignupStepThree,
} from 'src/sections/auth/signup-steps';

// ----------------------------------------------------------------------

export function SignupFormWizard() {
  const { t, i18n } = useTranslate('messages');

  const STEPS = [
    t('signUp.steps.personalDetails'),
    t('signUp.steps.companyDetails'),
    t('signUp.steps.paymentSummary'),
  ];

  const createStepOneSchema = () =>
    z.object({
      firstName: z.string().min(2, { message: t('signUp.validation.firstNameRequired') }),
      lastName: z.string().min(2, { message: t('signUp.validation.lastNameRequired') }),
      email: schemaUtils.email(),
      phone: z.string().min(10, { message: t('signUp.validation.phoneRequired') }),
      agreeToTerms: z
        .boolean()
        .refine((val) => val === true, { message: t('signUp.validation.agreeToTermsRequired') }),
    });

  const createStepTwoSchema = () => {
    // EU countries that require VAT (except Sweden)
    const EU_VAT_COUNTRIES = [
      'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
      'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
      'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
      'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain'
    ];

    return z.object({
      companyName: z.string().min(2, { message: t('signUp.validation.companyNameRequired') }),
      companyNumber: z.string().min(1, { message: t('signUp.validation.companyNumberRequired') }),
      address: z.string().min(5, { message: t('signUp.validation.addressRequired') }),
      city: z.string().min(2, { message: t('signUp.validation.cityRequired') }),
      country: z.string().min(1, { message: t('signUp.validation.countryRequired') }),
      vatNumber: z.string().optional(),
    }).refine(
      (data) => {
        // VAT number is optional for all countries
        // Only validate format if VAT number is provided and not empty
        if (!data.vatNumber || data.vatNumber.trim().length === 0) {
          return true; // Empty VAT number is valid (optional)
        }
        
        // If country is Sweden or not in EU_VAT_COUNTRIES, any format is acceptable
        if (data.country === 'Sweden' || !EU_VAT_COUNTRIES.includes(data.country)) {
          return true;
        }
        
        // For EU countries (except Sweden), validate VAT format only if provided
        return validateVATFormat(data.vatNumber, data.country);
      },
      {
        message: t('signUp.validation.vatNumberFormatInvalid'),
        path: ['vatNumber'],
      }
    );
  };

  const createStepThreeSchema = () =>
    z.object({
      paymentMethod: z.enum(['card', 'bank'], {
        message: t('signUp.validation.paymentMethodRequired'),
      }),
    });

  const WizardSchema = z.object({
    stepOne: createStepOneSchema(),
    stepTwo: createStepTwoSchema(),
    stepThree: createStepThreeSchema(),
  });

  type WizardSchemaType = z.infer<typeof WizardSchema>;

  const defaultValues: WizardSchemaType = {
    stepOne: { firstName: '', lastName: '', email: '', phone: '', agreeToTerms: false },
    stepTwo: {
      companyName: '',
      companyNumber: '',
      address: '',
      city: '',
      country: '',
      vatNumber: '',
    },
    stepThree: { paymentMethod: 'card' },
  };
  const [activeStep, setActiveStep] = useState(0);
  const [settings, setSettings] = useState({ vat: 25, price: 1000, vat_percentage: 25 });

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(WizardSchema),
    defaultValues,
  });

  const {
    trigger,
    handleSubmit,
    setError,
    formState: { isSubmitting, isValidating, errors },
  } = methods;

  const handleNext = useCallback(
    async (step?: 'stepOne' | 'stepTwo') => {
      if (step) {
        // STEP 1: Save current async errors BEFORE trigger (which will clear them)
        const currentStepErrors: any = step === 'stepOne' ? errors?.stepOne : errors?.stepTwo;
        const savedEmailError = currentStepErrors?.email;
        const savedPhoneError = currentStepErrors?.phone;

        // STEP 2: Check if there are async errors - BLOCK immediately
        const hasEmailAsyncError =
          savedEmailError &&
          (savedEmailError.type === 'duplicate' || savedEmailError.type === 'manual');
        const hasPhoneAsyncError =
          savedPhoneError &&
          (savedPhoneError.type === 'duplicate' || savedPhoneError.type === 'manual');

        if (hasEmailAsyncError || hasPhoneAsyncError) {
          // BLOCKED: async validation errors exist, don't proceed
          return;
        }

        // STEP 3: Run schema validation
        const isValid = await trigger(step);

        // STEP 4: Restore async errors if trigger cleared them
        if (step === 'stepOne') {
          if (hasEmailAsyncError && savedEmailError) {
            setError('stepOne.email', {
              type: savedEmailError.type,
              message: savedEmailError.message || t('signUp.errors.emailExists'),
            });
          }
          if (hasPhoneAsyncError && savedPhoneError) {
            setError('stepOne.phone', {
              type: savedPhoneError.type,
              message: savedPhoneError.message || t('signUp.errors.phoneExists'),
            });
          }
        }

        // STEP 5: Check schema validation result
        if (!isValid) {
          return;
        }

        // STEP 6: Final check after restoration
        const finalErrors: any =
          step === 'stepOne'
            ? methods.formState.errors?.stepOne
            : methods.formState.errors?.stepTwo;
        if (finalErrors && Object.keys(finalErrors).length > 0) {
          return;
        }

        // All validations passed, proceed to next step
        setActiveStep((currentStep) => currentStep + 1);
      } else {
        setActiveStep((currentStep) => currentStep + 1);
      }
    },
    [trigger, errors, methods, setError, t]
  );

  const handleBack = useCallback(() => {
    setActiveStep((currentStep) => currentStep - 1);
  }, []);

  // const handleReset = useCallback(() => {
  //   reset();
  //   setActiveStep(0);
  // }, [reset]);

  const handleSignupComplete = useCallback(
    async (paymentMethod: 'card' | 'bank', paymentFile?: File | null) => {
      const formData = methods.getValues();

      try {
        await initSanctumCsrf();

        // Create FormData for multipart/form-data
        const submitData = new FormData();

        // Step 1: Personal Details
        submitData.append('firstName', formData.stepOne.firstName);
        submitData.append('lastName', formData.stepOne.lastName);
        submitData.append('email', formData.stepOne.email);
        submitData.append('phone', formData.stepOne.phone);

        // Step 2: Company Details
        submitData.append('companyName', formData.stepTwo.companyName);
        submitData.append('companyNumber', formData.stepTwo.companyNumber);
        submitData.append('address', formData.stepTwo.address);
        submitData.append('city', formData.stepTwo.city);
        submitData.append('country', formData.stepTwo.country);
        if (formData.stepTwo.vatNumber) {
          submitData.append('vatNumber', formData.stepTwo.vatNumber);
        }

        // Step 3: Payment
        submitData.append('paymentMethod', paymentMethod);
        if (paymentFile) {
          submitData.append('paymentAttachment', paymentFile);
        }

        // Add user language preference - use i18n from hook for reactive language detection
        const currentLanguage = i18n.language || i18n.resolvedLanguage || localStorage.getItem('i18nextLng') || 'en';
        const langCode = currentLanguage.split('-')[0].toLowerCase();
        submitData.append('user_language', langCode);

        // Submit to API
        const response = await sanctum.post(endpoints.auth.signup, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // Handle response based on payment method
        if (paymentMethod === 'card') {
          // Redirect to Stripe checkout if URL is provided
          const checkoutUrl = (response.data as any)?.checkout_url;
          if (checkoutUrl) {
            window.location.href = checkoutUrl;
          }
          // Success dialog is shown by SignupStepThree component
        }
        // For bank transfer, success dialog is shown by SignupStepThree component
      } catch (error: any) {
        // Parse Laravel validation errors
        const responseData = error?.response?.data;
        
        // Check if there are field-specific validation errors
        if (responseData?.errors && typeof responseData.errors === 'object') {
          // Check for VAT number error
          if (responseData.errors.vatNumber && Array.isArray(responseData.errors.vatNumber) && responseData.errors.vatNumber.length > 0) {
            // Set the error on the form field with translated message
            setError('stepTwo.vatNumber', {
              type: 'manual',
              message: t('signUp.validation.vatNumberFormatInvalid'),
            });
            // Navigate back to step 2 so user can see the error
            setActiveStep(1);
            throw new Error(t('signUp.errors.signupFailed'));
          }
          
          // Handle other field errors if needed
          // For now, just throw a generic error
        }
        
        const message = error?.message || t('signUp.errors.signupFailed');
        throw new Error(message);
      }
    },
    [methods, t, setError, setActiveStep, i18n.language, i18n.resolvedLanguage]
  );

  const onSubmit = handleSubmit(async (data) => {
    // This won't be used directly anymore - payment buttons trigger handleSignupComplete
  });

  const completedStep = activeStep === STEPS.length;

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(endpoints.settings);
        // API returns { status: true, message: "...", data: { vat, price, vat_percentage } }
        const data = response.data?.data || response.data || {};
        setSettings({
          vat: data.vat || 25,
          price: data.price || 1000,
          vat_percentage: data.vat_percentage || data.vat || 25,
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        // Use defaults if fetch fails
        setSettings({
          vat: 25,
          price: 1000,
          vat_percentage: 25,
        });
      }
    };

    fetchSettings();
  }, []);

  // Check if current step has any errors (including async validation errors)
  const hasErrors = useMemo(() => {
    const e = errors as any;
    const stepErrors = activeStep === 0 ? e?.stepOne : activeStep === 1 ? e?.stepTwo : e?.stepThree;

    if (!stepErrors) return false;

    // Check if step has any errors - ANY key means errors exist
    const errorKeys = Object.keys(stepErrors);
    if (errorKeys.length > 0) {
      return true;
    }

    return false;
  }, [activeStep, errors]);

  return (
    <Card
      sx={{
        p: 5,
        width: 1,
        mx: 'auto',
        maxWidth: 720,
      }}
    >
      <SignupStepper steps={STEPS} activeStep={activeStep} />

      <Form methods={methods} onSubmit={onSubmit}>
        <Box
          sx={[
            (theme) => ({
              p: 3,
              mb: 3,
              gap: 3,
              minHeight: 240,
              display: 'flex',
              borderRadius: 1.5,
              flexDirection: 'column',
              border: `dashed 1px ${theme.vars.palette.divider}`,
            }),
          ]}
        >
          {activeStep === 0 && <SignupStepOne />}
          {activeStep === 1 && <SignupStepTwo />}
          {activeStep === 2 && (
            <SignupStepThree
              settings={settings}
              selectedCountry={methods.watch('stepTwo.country')}
              vatNumber={methods.watch('stepTwo.vatNumber')}
              onComplete={handleSignupComplete}
            />
          )}
        </Box>

        {!completedStep && activeStep < STEPS.length - 1 && (
          <Box sx={{ display: 'flex' }}>
            {activeStep !== 0 && <Button onClick={handleBack}>{t('signUp.buttons.back')}</Button>}

            <Box sx={{ flex: '1 1 auto' }} />

            {activeStep === 0 && (
              <Button
                type="submit"
                variant="contained"
                onClick={() => handleNext('stepOne')}
                disabled={hasErrors || isSubmitting || isValidating}
              >
                {t('signUp.buttons.next')}
              </Button>
            )}

            {activeStep === 1 && (
              <Button
                type="submit"
                variant="contained"
                onClick={() => handleNext('stepTwo')}
                disabled={hasErrors || isSubmitting || isValidating}
              >
                {t('signUp.buttons.next')}
              </Button>
            )}
          </Box>
        )}

        {activeStep === STEPS.length - 1 && !completedStep && (
          <Box sx={{ display: 'flex' }}>
            <Button onClick={handleBack}>{t('signUp.buttons.back')}</Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {/* Payment buttons are in SignupStepThree component */}
          </Box>
        )}
      </Form>
    </Card>
  );
}
