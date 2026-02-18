import { useState } from 'react';
import { useNavigate } from 'react-router';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { useTranslate } from 'src/locales/use-locales';
import { sendCaseConfirmationEmail } from 'src/actions/company-landing';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type CaseSubmissionDialogProps = {
  open: boolean;
  onClose: () => void;
  password: string;
  caseId: string;
  companySlug: string;
};

export function CaseSubmissionDialog({
  open,
  onClose,
  password,
  caseId,
  companySlug,
}: CaseSubmissionDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslate('company');
  const [email, setEmail] = useState('');
  const [passwordStored, setPasswordStored] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    toast.success(t('createCase.submissionDialog.passwordCopied'));
  };

  const handleContinue = async () => {
    if (!passwordStored) {
      toast.error(t('createCase.submissionDialog.confirmPasswordStored'));
      return;
    }

    // Email is optional - only send if provided and valid
    if (email) {
      // Validate email format if provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error(t('createCase.submissionDialog.validEmailRequired'));
        return;
      }

      try {
        setIsSending(true);
        await sendCaseConfirmationEmail(caseId, email);
        toast.success(t('createCase.submissionDialog.confirmationEmailSent'));
      } catch (error: any) {
        console.error('Error sending confirmation email:', error);
        // Show warning but allow user to continue
        toast.warning(error?.message || t('createCase.submissionDialog.emailSendFailed'));
      } finally {
        setIsSending(false);
      }
    }

    // Show success message
    toast.success(t('createCase.submissionDialog.caseSubmittedSuccess'));
    
    // Close dialog and redirect to thank you page
    onClose();
    navigate(`/company/${companySlug}/thank-you`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="body">
      <Alert severity="success" sx={{ m: 0, borderRadius: 0 }}>
        {t('createCase.submissionDialog.dataSavedSuccessfully')}
      </Alert>

      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          {t('createCase.submissionDialog.reportSubmittedTitle')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Iconify icon="solar:user-id-bold" width={24} />
          </Box>
          <Typography variant="subtitle1">test</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            <Typography component="span" sx={{ color: 'error.main', fontWeight: 'bold' }}>
              {t('createCase.submissionDialog.important')}
            </Typography>
            : {t('createCase.submissionDialog.passwordInstructions')}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
            {t('createCase.submissionDialog.uniquePasswordLabel')}
          </Typography>
          <TextField
            fullWidth
            value={password}
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleCopyPassword} edge="end">
                    <Iconify icon="solar:copy-bold" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label={t('createCase.submissionDialog.emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('createCase.submissionDialog.emailLabel')}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('createCase.submissionDialog.emailDescription')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('createCase.submissionDialog.notificationMessageHandler')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('createCase.submissionDialog.notificationStatusUpdated')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
              {t('createCase.submissionDialog.notificationNewHandler')}
            </Typography>
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={passwordStored}
              onChange={(e) => setPasswordStored(e.target.checked)}
            />
          }
          label={t('createCase.submissionDialog.passwordStoredConfirmation')}
          sx={{ mb: 2 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleContinue}
          disabled={!passwordStored || isSending}
          sx={{
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {isSending ? t('createCase.submissionDialog.sending') : t('createCase.submissionDialog.continue')}
        </Button>

        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          2025 © Wisling
        </Typography>
      </DialogActions>
    </Dialog>
  );
}
