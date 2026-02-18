import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import { MuiOtpInput } from 'mui-one-time-password-input';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

type TwoFactorStatus = {
  enabled: boolean;
  method: 'email' | 'app' | null;
  has_secret: boolean;
};

type MethodTab = 'email' | 'app';

// ----------------------------------------------------------------------

export function AccountTwoFactor() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MethodTab>('email');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toggleProcessing, setToggleProcessing] = useState<boolean>(false);

  // Email method state
  const [emailCode, setEmailCode] = useState('');
  const [emailCodeSending, setEmailCodeSending] = useState(false);

  // App method state
  const [appSecret, setAppSecret] = useState<string | null>(null);
  const [appOtpAuthUrl, setAppOtpAuthUrl] = useState<string | null>(null);
  const [appCode, setAppCode] = useState('');
  const [appSetupLoading, setAppSetupLoading] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      await initSanctumCsrf();
      const res = await sanctum.get('/api/v1/profile/2fa');
      
      // The axios interceptor unwraps the response, so res.data is already the inner data object
      // Backend returns: { status: true, message: "...", data: { enabled: true, method: "app", has_secret: true } }
      // After interceptor: res.data = { enabled: true, method: "app", has_secret: true }
      const data = (res as any)?.data as TwoFactorStatus;
      
      
      if (data && typeof data === 'object') {
        setStatus({
          enabled: Boolean(data.enabled),
          method: data.method || null,
          has_secret: Boolean(data.has_secret),
        });
        if (data.method === 'app') {
          setActiveTab('app');
        } else {
          setActiveTab('email');
        }
      } else {
        // Default status if response is empty
        setStatus({
          enabled: false,
          method: null,
          has_secret: false,
        });
      }
    } catch (err: any) {
      console.error('❌ Failed to load 2FA status:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load two-factor authentication status.';
      setError(errorMessage);
      // Set default status on error
      setStatus({
        enabled: false,
        method: null,
        has_secret: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: MethodTab) => {
    setActiveTab(newValue);
    setError(null);
    setSuccess(null);
  };

  const handleSendEmailCode = async () => {
    try {
      setEmailCodeSending(true);
      setError(null);
      setSuccess(null);
      await initSanctumCsrf();
      await sanctum.post('/api/v1/profile/2fa/send-email-code', { reason: 'enable' });
      setSuccess('Verification code has been sent to your email.');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send verification code.';
      setError(errorMessage);
    } finally {
      setEmailCodeSending(false);
    }
  };

  const handleSetupApp = async () => {
    try {
      setAppSetupLoading(true);
      setError(null);
      setSuccess(null);
      await initSanctumCsrf();
      const res = await sanctum.post('/api/v1/profile/2fa/setup-app');
      
      // The axios interceptor unwraps the response envelope, so res.data is already the inner data object
      // Backend returns: { status: true, message: "...", data: { secret: "...", otpauth_url: "..." } }
      // After interceptor: res.data = { secret: "...", otpauth_url: "..." }
      const data = (res as any)?.data as { secret: string; otpauth_url: string };
      
      
      if (data?.secret && data?.otpauth_url) {
        setAppSecret(data.secret);
        setAppOtpAuthUrl(data.otpauth_url);
        setSuccess('Scan the QR code or enter the secret into your authenticator app, then enter a code to enable 2FA.');
      } else {
        console.error('❌ Invalid response structure:', data);
        setError('Invalid response from server. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Setup app error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to generate authenticator app secret.';
      setError(errorMessage);
    } finally {
      setAppSetupLoading(false);
    }
  };

  const handleEnable = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const method: MethodTab = activeTab;
      const code = method === 'email' ? emailCode : appCode;

      if (!code || code.length < 6) {
        setError('Please enter a valid 6-digit code.');
        setSaving(false);
        return;
      }

      // If the other method is enabled, disable it first
      const otherMethodWasEnabled = status?.enabled && status?.method && status.method !== method;
      if (otherMethodWasEnabled) {
        try {
          await initSanctumCsrf();
          await sanctum.post('/api/v1/profile/2fa/disable');
        } catch (disableErr) {
          console.error('Failed to disable previous method:', disableErr);
          // Continue anyway
        }
      }

      await initSanctumCsrf();
      const res = await sanctum.post('/api/v1/profile/2fa/enable', { method, code });
      
      // The axios interceptor unwraps the response, so res.data is already the inner data object
      // Backend returns: { status: true, message: "...", data: { enabled: true, method: "app" } }
      // After interceptor: res.data = { enabled: true, method: "app" }
      const data = (res as any)?.data as { enabled: boolean; method: 'email' | 'app' };

      if (!data || !data.method) {
        // Fallback: use the method we sent if response doesn't have it
        setStatus({
          enabled: true,
          method,
          has_secret: method === 'app' ? Boolean(appSecret) : false,
        });
      } else {
        setStatus({
          enabled: true,
          method: data.method,
          has_secret: data.method === 'app' ? Boolean(appSecret) : false,
        });
      }

      const methodName = method === 'app' ? 'authenticator app' : 'email codes';
      const otherMethodName = method === 'app' ? 'email codes' : 'authenticator app';
      
      if (otherMethodWasEnabled) {
        setSuccess(`Two-factor authentication has been enabled using ${methodName}. ${otherMethodName.charAt(0).toUpperCase() + otherMethodName.slice(1)} 2FA has been automatically disabled.`);
      } else {
        setSuccess(`Two-factor authentication has been enabled using ${methodName}.`);
      }
      setEmailCode('');
      setAppCode('');
      
      // Reload status to ensure consistency
      await loadStatus();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to enable two-factor authentication.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDisableMethod = async (methodToDisable: 'email' | 'app') => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Only disable if this method is currently enabled
      if (status?.enabled && status?.method === methodToDisable) {
        await initSanctumCsrf();
        await sanctum.post('/api/v1/profile/2fa/disable');
        setStatus({
          enabled: false,
          method: null,
          has_secret: false,
        });
        setAppSecret(null);
        setAppOtpAuthUrl(null);
        setEmailCode('');
        setAppCode('');
        setSuccess('Two-factor authentication has been disabled.');
      }
      
      // Reload status to ensure consistency
      await loadStatus();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to disable two-factor authentication.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      {/* 2FA Status Card with Switch */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6">Two-Factor Authentication</Typography>
              <Typography variant="body2" color="text.secondary">
                {status?.enabled
                  ? `Currently enabled using ${status.method === 'app' ? 'authenticator app' : 'email codes'}`
                  : 'Add an extra layer of security to your account'}
              </Typography>
            </Box>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                cursor: (saving || loading || toggleProcessing) ? 'not-allowed' : 'pointer',
              }}
            >
              <Typography variant="body2" sx={{ minWidth: 60 }}>
                {status?.enabled ? 'Enabled' : 'Disabled'}
              </Typography>
              <Switch
                checked={Boolean(status?.enabled)}
                disabled={saving || loading || toggleProcessing}
                onChange={async (e) => {
                  if (saving || loading || toggleProcessing) {
                    return;
                  }
                  
                  const currentlyEnabled = Boolean(status?.enabled);
                  const previousStatus = status;
                  
                  // Optimistically update the UI state immediately
                  if (currentlyEnabled) {
                    // Disable 2FA - optimistically update state
                    setStatus({
                      enabled: false,
                      method: null,
                      has_secret: false,
                    });
                    setToggleProcessing(true);
                    
                    try {
                      await initSanctumCsrf();
                      await sanctum.post('/api/v1/profile/2fa/disable');
                      
                      // Reload status to ensure consistency
                      await loadStatus();
                      setAppSecret(null);
                      setAppOtpAuthUrl(null);
                      setEmailCode('');
                      setAppCode('');
                      setSuccess('Two-factor authentication has been disabled.');
                    } catch (err: any) {
                      // Revert optimistic update on error
                      if (previousStatus) {
                        setStatus(previousStatus);
                      }
                      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to disable two-factor authentication.';
                      setError(errorMessage);
                      // Reload status even on error to ensure UI is in sync
                      await loadStatus();
                    } finally {
                      setToggleProcessing(false);
                    }
                  } else {
                    // When clicking on disabled switch, optimistically enable it visually
                    // but show that setup is needed
                    const targetTab: MethodTab = status?.method === 'app' ? 'app' : 'email';
                    
                    // Optimistically update status to show switch as enabled (green)
                    setStatus({
                      enabled: true,
                      method: targetTab,
                      has_secret: targetTab === 'app' ? Boolean(appSecret) : false,
                    });
                    
                    setToggleProcessing(true);
                    
                    // Clear previous messages
                    setError(null);
                    setSuccess(null);
                    
                    // If already on target tab, switch to the other one first, then back
                    // This ensures visual feedback
                    if (activeTab === targetTab) {
                      const otherTab: MethodTab = targetTab === 'email' ? 'app' : 'email';
                      setActiveTab(otherTab);
                      setTimeout(() => {
                        setActiveTab(targetTab);
                        setSuccess(`Please complete the setup below to enable 2FA using ${targetTab === 'app' ? 'authenticator app' : 'email codes'}.`);
                        setToggleProcessing(false);
                        
                        // Scroll to the setup section
                        setTimeout(() => {
                          const tabContent = document.querySelector('[role="tabpanel"]');
                          if (tabContent) {
                            tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }, 150);
                    } else {
                      // Switch to target tab
                      setActiveTab(targetTab);
                      setSuccess(`Please complete the setup below to enable 2FA using ${targetTab === 'app' ? 'authenticator app' : 'email codes'}.`);
                      setToggleProcessing(false);
                      
                      // Scroll to the setup section
                      setTimeout(() => {
                        const tabContent = document.querySelector('[role="tabpanel"]');
                        if (tabContent) {
                          tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 200);
                    }
                  }
                }}
              />
              {toggleProcessing && (
                <CircularProgress size={16} sx={{ ml: 1 }} />
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {!!error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!!success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
        aria-label="Two-factor authentication method"
      >
        <Tab label="Email code" value="email" />
        <Tab label="Authenticator app" value="app" />
      </Tabs>
      
      {/* Add a key to force re-render when tab changes programmatically */}
      <Box key={activeTab}>

      {activeTab === 'email' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Email Code Authentication
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receive a one-time code via email when you sign in. You will need to enter this code in addition to
                    your password.
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    cursor: (saving || loading || toggleProcessing) ? 'not-allowed' : 'pointer',
                    ml: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ minWidth: 60 }}>
                    {status?.enabled && status?.method === 'email' ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Switch
                    checked={status?.enabled && status?.method === 'email'}
                    disabled={saving || loading || toggleProcessing}
                    onChange={async (e) => {
                      if (saving || loading || toggleProcessing) {
                        return;
                      }
                      
                      const isEmailEnabled = status?.enabled && status?.method === 'email';
                      const previousStatus = status;
                      
                      if (isEmailEnabled) {
                        // Disable Email 2FA - handleDisableMethod will update the state
                        await handleDisableMethod('email');
                      } else {
                        // Optimistically enable Email 2FA visually so toggle turns green immediately
                        setStatus({
                          enabled: true,
                          method: 'email',
                          has_secret: false,
                        });
                        
                        // If Authenticator app is enabled, disable it first, then guide user to enable Email
                        if (previousStatus?.enabled && previousStatus?.method === 'app') {
                          try {
                            setToggleProcessing(true);
                            await handleDisableMethod('app');
                            // After disabling app, reload status to get correct state
                            await loadStatus();
                            // Re-apply optimistic update for email
                            setStatus({
                              enabled: true,
                              method: 'email',
                              has_secret: false,
                            });
                            setSuccess('Please complete the setup below to enable Email 2FA.');
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          } catch (_err: any) {
                            // Revert optimistic update on error
                            if (previousStatus) {
                              setStatus(previousStatus);
                            }
                          } finally {
                            setToggleProcessing(false);
                          }
                        } else {
                          // Just show setup instructions
                          setSuccess('Please complete the setup below to enable Email 2FA.');
                        }
                      }
                    }}
                  />
                  {(saving || toggleProcessing) && (
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  )}
                </Box>
              </Box>

              {status?.enabled && status?.method === 'email' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="success">
                    Two-factor authentication is enabled using email codes.
                  </Alert>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDisableMethod('email')}
                    disabled={saving}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {saving ? 'Disabling...' : 'Disable Email 2FA'}
                  </Button>
                </Box>
              ) : status?.enabled && status?.method === 'app' ? (
                <Alert severity="info">
                  Authenticator app 2FA is currently enabled. Enabling Email 2FA will automatically disable Authenticator app 2FA.
                </Alert>
              ) : (
                <>
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Button
                        variant="contained"
                        onClick={handleSendEmailCode}
                        disabled={emailCodeSending}
                        sx={{ minWidth: 140 }}
                      >
                        {emailCodeSending ? (
                          <>
                            <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
                            Sending...
                          </>
                        ) : (
                          'Send code'
                        )}
                      </Button>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                        We will send a 6-digit verification code to your account email.
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                      Enter verification code
                    </Typography>
                    <MuiOtpInput
                      length={6}
                      value={emailCode}
                      onChange={setEmailCode}
                      TextFieldsProps={{ placeholder: '‒', inputMode: 'numeric' }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    onClick={handleEnable}
                    disabled={saving || !emailCode || emailCode.length !== 6}
                    size="large"
                    fullWidth
                  >
                    {saving ? 'Enabling...' : 'Enable 2FA with email'}
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 'app' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Authenticator App
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use an authenticator app (such as Google Authenticator, Microsoft Authenticator, or Authy) to generate
                    time-based codes when you sign in.
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    cursor: (saving || loading || toggleProcessing) ? 'not-allowed' : 'pointer',
                    ml: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ minWidth: 60 }}>
                    {status?.enabled && status?.method === 'app' ? 'Enabled' : 'Disabled'}
                  </Typography>
                  <Switch
                    checked={status?.enabled && status?.method === 'app'}
                    disabled={saving || loading || toggleProcessing}
                    onChange={async (e) => {
                      if (saving || loading || toggleProcessing) {
                        return;
                      }
                      
                      const isAppEnabled = status?.enabled && status?.method === 'app';
                      const previousStatus = status;
                      
                      if (isAppEnabled) {
                        // Disable Authenticator App 2FA - handleDisableMethod will update the state
                        await handleDisableMethod('app');
                      } else {
                        // Optimistically enable Authenticator App 2FA visually so toggle turns green immediately
                        setStatus({
                          enabled: true,
                          method: 'app',
                          has_secret: Boolean(appSecret),
                        });
                        
                        // If Email 2FA is enabled, disable it first, then guide user to enable App
                        if (previousStatus?.enabled && previousStatus?.method === 'email') {
                          try {
                            setToggleProcessing(true);
                            await handleDisableMethod('email');
                            // After disabling email, reload status to get correct state
                            await loadStatus();
                            // Re-apply optimistic update for app
                            setStatus({
                              enabled: true,
                              method: 'app',
                              has_secret: Boolean(appSecret),
                            });
                            setSuccess('Please complete the setup below to enable Authenticator App 2FA.');
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          } catch (_err: any) {
                            // Revert optimistic update on error
                            if (previousStatus) {
                              setStatus(previousStatus);
                            }
                          } finally {
                            setToggleProcessing(false);
                          }
                        } else {
                          // Just show setup instructions
                          setSuccess('Please complete the setup below to enable Authenticator App 2FA.');
                        }
                      }
                    }}
                  />
                  {(saving || toggleProcessing) && (
                    <CircularProgress size={16} sx={{ ml: 1 }} />
                  )}
                </Box>
              </Box>

              {status?.enabled && status?.method === 'app' ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Alert severity="success">
                    Two-factor authentication is enabled using authenticator app.
                  </Alert>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDisableMethod('app')}
                    disabled={saving}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {saving ? 'Disabling...' : 'Disable Authenticator App 2FA'}
                  </Button>
                </Box>
              ) : status?.enabled && status?.method === 'email' ? (
                <Alert severity="info">
                  Email code 2FA is currently enabled. Enabling Authenticator app 2FA will automatically disable Email 2FA.
                </Alert>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSetupApp}
                  disabled={appSetupLoading}
                  sx={{ alignSelf: 'flex-start', minWidth: 180 }}
                >
                  {appSetupLoading ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} color="inherit" />
                      Generating...
                    </>
                  ) : appSecret ? (
                    'Regenerate secret'
                  ) : (
                    'Generate secret'
                  )}
                </Button>
              )}

              {appSecret && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {appOtpAuthUrl && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Paper
                        elevation={2}
                        sx={{
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                          backgroundColor: 'background.paper',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Scan this QR code with your authenticator app
                        </Typography>
                        <Box
                          sx={{
                            p: 2,
                            backgroundColor: 'white',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <QRCodeSVG value={appOtpAuthUrl} size={200} level="M" />
                        </Box>
                      </Paper>
                    </Box>
                  )}
                  
                  <TextField
                    label="Secret key"
                    value={appSecret}
                    InputProps={{ readOnly: true }}
                    fullWidth
                    helperText="You can manually enter this secret key if you cannot scan the QR code"
                  />
                  
                  {appOtpAuthUrl && (
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      Or use this URL: {appOtpAuthUrl}
                    </Typography>
                  )}
                </Box>
              )}

              {appSecret && !status?.enabled && (
                <>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                      Enter verification code from your authenticator app
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      After adding the secret to your authenticator app, enter a 6-digit code from the app to confirm
                      and enable 2FA.
                    </Typography>
                    <MuiOtpInput
                      length={6}
                      value={appCode}
                      onChange={setAppCode}
                      TextFieldsProps={{ placeholder: '‒', inputMode: 'numeric' }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    onClick={handleEnable}
                    disabled={saving || !appCode || appCode.length !== 6}
                    size="large"
                    fullWidth
                  >
                    {saving ? 'Enabling...' : 'Enable 2FA with authenticator app'}
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
      </Box>
    </Box>
  );
}


