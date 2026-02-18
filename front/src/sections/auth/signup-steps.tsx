import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MuiStepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { getVATFormatDescription } from 'src/utils/vat-validation';

import { CONFIG } from 'src/global-config';
import { useTranslate } from 'src/locales';
import axiosInstance, { endpoints } from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';
import { useGetPublicPaymentPage } from 'src/actions/payment-page-public';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import { RHFPhoneInput } from 'src/components/hook-form/rhf-phone-input';
import { RHFCountrySelect } from 'src/components/hook-form/rhf-country-select';

import { PrivacyPolicyContent } from 'src/sections/privacy-policy/privacy-policy-content';

// ----------------------------------------------------------------------

type StepperProps = {
  steps: string[];
  activeStep: number;
};

export function SignupStepper({ steps, activeStep }: StepperProps) {
  return (
    <MuiStepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
      {steps.map((label, index) => (
        <Step key={label}>
          <StepLabel
            slots={{
              stepIcon: ({ active, completed }) => (
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    borderRadius: '50%',
                    alignItems: 'center',
                    color: 'text.disabled',
                    typography: 'subtitle2',
                    justifyContent: 'center',
                    bgcolor: 'action.disabledBackground',
                    ...(active && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
                    ...(completed && { bgcolor: 'primary.main', color: 'primary.contrastText' }),
                  }}
                >
                  {completed ? (
                    <Iconify width={16} icon="eva:checkmark-fill" />
                  ) : (
                    <Box sx={{ typography: 'subtitle2' }}>{index + 1}</Box>
                  )}
                </Box>
              ),
            }}
          >
            {label}
          </StepLabel>
        </Step>
      ))}
    </MuiStepper>
  );
}

// ----------------------------------------------------------------------

export function SignupStepOne() {
  const { t } = useTranslate('messages');
  const methods = useFormContext();
  const { setError, clearErrors, getValues } = methods;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const handleCheckEmail = async () => {
    const email: string = getValues('stepOne.email');
    if (!email) {
      clearErrors('stepOne.email');
      return;
    }
    try {
      await initSanctumCsrf();
      const res = await sanctum.post(endpoints.auth.checkEmail, { email });
      const exists = !!(res.data as any)?.exists;
      if (exists) {
        setError('stepOne.email', { type: 'duplicate', message: t('signUp.errors.emailExists') });
      } else {
        clearErrors('stepOne.email');
      }
    } catch (err: any) {
      // show backend-provided message if available
      const msg = err?.message || t('signUp.errors.unableToValidateEmail');
      setError('stepOne.email', { type: 'manual', message: msg });
    }
  };

  const handleCheckPhone = async () => {
    const phone: string = getValues('stepOne.phone');
    if (!phone) {
      clearErrors('stepOne.phone');
      return;
    }
    try {
      await initSanctumCsrf();
      const res = await sanctum.post(endpoints.auth.checkPhone, { phone });
      const exists = !!(res.data as any)?.exists;
      if (exists) {
        setError('stepOne.phone', { type: 'duplicate', message: t('signUp.errors.phoneExists') });
      } else {
        clearErrors('stepOne.phone');
      }
    } catch (err: any) {
      const msg = err?.message || t('signUp.errors.unableToValidatePhone');
      setError('stepOne.phone', { type: 'manual', message: msg });
    }
  };

  const fetchContent = async (type: 'privacy' | 'terms') => {
    setLoadingContent(true);
    setContentError(null);
    try {
      const endpoint = type === 'privacy' 
        ? '/api/v1/public/pages/privacy-policy'
        : '/api/v1/public/pages/terms-conditions';
      
      const response = await axiosInstance.get(endpoint, {
        baseURL: CONFIG.serverUrl || undefined,
      });

      const raw = (response as any)?.data ?? response;
      const payload = raw?.data ?? raw;
      
      const title = payload?.page_title || payload?.title || (type === 'privacy' ? 'Privacy Policy' : 'Terms of Service');
      const content = payload?.page_content || payload?.content || '';

      setModalContent({ title, content });
      setModalType(type);
      setModalOpen(true);
    } catch (err: any) {
      console.error(`Failed to load ${type} page:`, err);
      setContentError(err?.message || `Failed to load ${type === 'privacy' ? 'privacy policy' : 'terms of service'}.`);
      setModalContent(null);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleOpenPrivacy = (e: React.MouseEvent) => {
    e.preventDefault();
    fetchContent('privacy');
  };

  const handleOpenTerms = (e: React.MouseEvent) => {
    e.preventDefault();
    fetchContent('terms');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setModalType(null);
    setModalContent(null);
    setContentError(null);
  };

  return (
    <>
      <Field.Text
        name="stepOne.firstName"
        label={t('signUp.stepOne.firstName')}
        variant="filled"
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Field.Text
        name="stepOne.lastName"
        label={t('signUp.stepOne.lastName')}
        variant="filled"
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Field.Text
        name="stepOne.email"
        label={t('signUp.stepOne.email')}
        type="email"
        variant="filled"
        slotProps={{ inputLabel: { shrink: true } }}
        onBlur={handleCheckEmail}
      />
      <RHFPhoneInput
        name="stepOne.phone"
        label={t('signUp.stepOne.phone')}
        variant="filled"
        slotProps={{ inputLabel: { shrink: true } }}
        onBlur={handleCheckPhone}
      />
      <Field.Checkbox
        name="stepOne.agreeToTerms"
        label={
          <>
            {t('signUp.stepOne.agreeToTerms')}{' '}
            <Link
              href="#"
              onClick={handleOpenPrivacy}
              sx={{ cursor: 'pointer' }}
            >
              {t('signUp.stepOne.privacyPolicy')}
            </Link>{' '}
            {t('signUp.stepOne.and')}{' '}
            <Link
              href="#"
              onClick={handleOpenTerms}
              sx={{ cursor: 'pointer' }}
            >
              {t('signUp.stepOne.termsOfService')}
            </Link>
          </>
        }
      />

      {/* Terms and Privacy Policy Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {modalContent?.title || (modalType === 'privacy' ? 'Privacy Policy' : 'Terms of Service')}
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <Iconify icon="solar:close-circle-bold" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {loadingContent && (
            <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
              <CircularProgress size={32} />
              <Typography sx={{ color: 'text.secondary' }}>
                Loading {modalType === 'privacy' ? 'privacy policy' : 'terms of service'}…
              </Typography>
            </Stack>
          )}
          {contentError && !loadingContent && (
            <Typography align="center" color="error" sx={{ mt: 4 }}>
              {contentError}
            </Typography>
          )}
          {!loadingContent && !contentError && modalContent && (
            <PrivacyPolicyContent content={modalContent.content} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} variant="contained">
            {t('signUp.buttons.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function SignupStepTwo() {
  const { t } = useTranslate('messages');
  const methods = useFormContext();
  const { setError, clearErrors, getValues, watch } = methods;

  // Watch country to conditionally show VAT field
  const selectedCountry = watch('stepTwo.country');
  const isEUCountryExceptSweden = selectedCountry && 
    EU_VAT_COUNTRIES.includes(selectedCountry) && 
    selectedCountry !== 'Sweden';

  const handleCheckCompanyName = async () => {
    const companyName: string = getValues('stepTwo.companyName');
    if (!companyName) {
      clearErrors('stepTwo.companyName');
      return;
    }
    try {
      await initSanctumCsrf();
      const res = await sanctum.post(endpoints.auth.checkCompanyName, { companyName });
      const exists = !!(res.data as any)?.exists;
      if (exists) {
        setError('stepTwo.companyName', { type: 'duplicate', message: t('signUp.errors.companyNameExists') });
      } else {
        clearErrors('stepTwo.companyName');
      }
    } catch (err: any) {
      const msg = err?.message || t('signUp.errors.unableToValidateCompanyName');
      setError('stepTwo.companyName', { type: 'manual', message: msg });
    }
  };

  return (
    <>
      <Field.Text
        name="stepTwo.companyName"
        label={t('signUp.stepTwo.companyName')}
        variant="filled"
        slotProps={{ inputLabel: { shrink: true } }}
        onBlur={handleCheckCompanyName}
      />
      <Box sx={{ position: 'relative' }}>
        <Field.Text
          name="stepTwo.companyNumber"
          label={t('signUp.stepTwo.companyNumber')}
          variant="filled"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Tooltip title={t('signUp.stepTwo.companyNumberTooltip')} arrow>
          <Iconify
            icon="eva:info-outline"
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              color: 'text.disabled',
            }}
          />
        </Tooltip>
      </Box>
      <Field.Text
        name="stepTwo.address"
        label={t('signUp.stepTwo.address')}
        variant="filled"
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Field.Text
        name="stepTwo.city"
        label={t('signUp.stepTwo.city')}
        variant="filled"
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <RHFCountrySelect
        name="stepTwo.country"
        label={t('signUp.stepTwo.country')}
        variant="filled"
      />
      {isEUCountryExceptSweden && (
        <Field.Text
          name="stepTwo.vatNumber"
          label={t('signUp.stepTwo.vatNumber')}
          variant="filled"
          slotProps={{ 
            inputLabel: { shrink: true },
            input: {
              placeholder: getVATFormatDescription(selectedCountry),
            },
          }}
          helperText={getVATFormatDescription(selectedCountry)}
        />
      )}
    </>
  );
}

// EU countries that have VAT
const EU_VAT_COUNTRIES = [
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Ireland',
  'Italy',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
];

type SignupStepThreeProps = {
  settings: { vat: number; price: number; vat_percentage: number };
  selectedCountry: string;
  vatNumber?: string;
  onComplete: (paymentMethod: 'card' | 'bank', paymentFile?: File | null) => Promise<void>;
};

export function SignupStepThree({ settings, selectedCountry, vatNumber, onComplete }: SignupStepThreeProps) {
  const { t } = useTranslate('messages');
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch payment page content from backend
  const { data: paymentPage, isLoading: isLoadingPaymentPage } = useGetPublicPaymentPage();

  // Calculate VAT based on selected country and VAT number
  // Normalize country name (trim whitespace and handle empty)
  const normalizedCountry = selectedCountry ? selectedCountry.trim() : '';
  const isEUCountry = normalizedCountry && EU_VAT_COUNTRIES.includes(normalizedCountry);
  const isSweden = normalizedCountry === 'Sweden';
  const hasVatNumber = vatNumber && vatNumber.trim().length > 0;

  // VAT calculation rules (matching backend logic):
  // 1. Swedish customers: Always pay VAT (regardless of VAT number)
  // 2. EU countries (non-Swedish): Pay VAT only if no VAT number provided
  // 3. Non-EU countries: No VAT
  let vatPercentage = 0;
  if (isSweden) {
    // Swedish customers always pay VAT
    vatPercentage = settings.vat_percentage || settings.vat || 25;
  } else if (isEUCountry && !hasVatNumber) {
    // EU countries (non-Swedish) pay VAT only if no VAT number
    vatPercentage = settings.vat_percentage || settings.vat || 25;
  }

  const subscriptionPrice = settings.price || 1000;

  // Calculate VAT amount in currency: price * (VAT percentage / 100)
  // Example: 1000 * (25 / 100) = 250
  const vatAmount = (subscriptionPrice * vatPercentage) / 100;
  const totalAmount = subscriptionPrice + vatAmount;


  const handlePaymentMethod = (method: 'card' | 'bank') => {
    setPaymentMethod(method);

    // For both card and bank, directly submit without requiring receipt upload
    handleSubmitPayment(method, null);
  };

  const handleSubmitPayment = async (method: 'card' | 'bank', file: File | null) => {
    setIsSubmitting(true);

    try {
      await onComplete(method, file);
      // Open success dialog for bank transfer
      if (method === 'bank') {
        setDialogOpen(true);
      }
      setIsSubmitting(false);
    } catch {
      // Error is handled by onComplete callback
      setIsSubmitting(false);
    }
  };


  const handleCloseDialog = () => {
    setDialogOpen(false);
    setPaymentMethod(null);
  };

  const handleBackToHome = () => {
    setDialogOpen(false);
    setPaymentMethod(null);
    router.push('/');
  };

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ p: 3 }}>
          {isLoadingPaymentPage ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {paymentPage?.page_title && (
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {paymentPage.page_title}
                </Typography>
              )}
              {paymentPage?.page_content && (
                <Box
                  sx={{
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      color: 'text.primary',
                      fontWeight: 600,
                      mb: 2,
                      mt: 3,
                      '&:first-of-type': {
                        mt: 0,
                      },
                    },
                    '& h1': {
                      fontSize: { xs: '1.5rem', md: '2rem' },
                      mb: 3,
                    },
                    '& h2': {
                      fontSize: { xs: '1.25rem', md: '1.5rem' },
                    },
                    '& h3': {
                      fontSize: { xs: '1.125rem', md: '1.25rem' },
                    },
                    '& p': {
                      color: 'text.secondary',
                      lineHeight: 1.7,
                      mb: 2,
                    },
                    '& ul, & ol': {
                      pl: 3,
                      mb: 2,
                      '& li': {
                        color: 'text.secondary',
                        lineHeight: 1.7,
                        mb: 0.5,
                      },
                    },
                    '& strong': {
                      fontWeight: 600,
                      color: 'text.primary',
                    },
                    '& a': {
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    },
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: 1,
                      my: 2,
                    },
                  }}
                  dangerouslySetInnerHTML={{ __html: paymentPage?.page_content || '' }}
                />
              )}
              {!paymentPage?.page_content && !paymentPage?.page_title && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {t('signUp.stepThree.subscribeTitle')}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                    {t('signUp.stepThree.subscribeDescription')}
                  </Typography>

                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t('signUp.stepThree.whyChooseUs')}
                  </Typography>
                  <Box component="ol" sx={{ pl: 2, mb: 3 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{t('signUp.stepThree.confidentialReporting')}</strong>:{' '}
                      {t('signUp.stepThree.confidentialReportingDesc')}
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{t('signUp.stepThree.userFriendlyInterface')}</strong>:{' '}
                      {t('signUp.stepThree.userFriendlyInterfaceDesc')}
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{t('signUp.stepThree.securePlatform')}</strong>:{' '}
                      {t('signUp.stepThree.securePlatformDesc')}
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                      <strong>{t('signUp.stepThree.comprehensiveReporting')}</strong>:{' '}
                      {t('signUp.stepThree.comprehensiveReportingDesc')}
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {t('signUp.stepThree.keyFeatures')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('signUp.stepThree.userAuthentication')}
                  </Typography>
                </>
              )}
            </>
          )}
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('signUp.stepThree.orderSummary')}
          </Typography>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">{t('signUp.stepThree.subscription')}</Typography>
              <Typography variant="body2">${subscriptionPrice.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                {t('signUp.stepThree.vat')} {vatPercentage > 0 ? `${vatPercentage}%` : '0%'}
              </Typography>
              <Typography variant="body2">${vatAmount.toFixed(2)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {t('signUp.stepThree.total')}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                ${totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={2} sx={{ mt: 3 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => handlePaymentMethod('card')}
              disabled={isSubmitting}
            >
              {t('signUp.stepThree.payWithCard')}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => handlePaymentMethod('bank')}
              disabled={isSubmitting}
            >
              {t('signUp.stepThree.bankTransfer')}
            </Button>
          </Stack>
        </Card>
      </Grid>


      {/* Payment Response Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} scroll="body" maxWidth="sm" fullWidth>
        <DialogTitle>
          {paymentMethod === 'card'
            ? t('signUp.stepThree.paymentConfirmation')
            : t('signUp.stepThree.bankTransferDetails')}
        </DialogTitle>

        <DialogContent sx={{ color: 'text.secondary' }}>
          {paymentMethod === 'card' ? (
            <>
              {t('signUp.stepThree.cardPaymentMessage')}
              <br />
              <br />
              {t('signUp.stepThree.thankYou')}
            </>
          ) : (
            <>
              {t('signUp.stepThree.bankTransferMessage')}
              <br />
              <br />
              {t('signUp.stepThree.thankYou')}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="contained" onClick={handleBackToHome} autoFocus>
            {t('signUp.stepThree.backToHome')}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
