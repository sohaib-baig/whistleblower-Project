import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type SessionTimeoutDialogProps = {
  open: boolean;
  timeRemaining: number; // in milliseconds
  onExtend: () => void;
  onLogout: () => void;
};

export function SessionTimeoutDialog({
  open,
  timeRemaining,
  onExtend,
  onLogout,
}: SessionTimeoutDialogProps) {
  const [displayTime, setDisplayTime] = useState<string>('');

  // Update display time every second
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const updateDisplayTime = (remaining: number) => {
      const seconds = Math.ceil(remaining / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      if (minutes > 0) {
        setDisplayTime(`${minutes}m ${remainingSeconds}s`);
      } else {
        setDisplayTime(`${remainingSeconds}s`);
      }
    };

    // Initial update
    updateDisplayTime(timeRemaining);

    // Update every second
    const interval = setInterval(() => {
      // Calculate remaining time by subtracting 1 second each time
      // This ensures countdown continues even if timeRemaining prop doesn't update
      setDisplayTime((prev) => {
        // Parse current display time to get seconds
        const match = prev.match(/(?:(\d+)m\s*)?(\d+)s/);
        if (match) {
          const minutes = Number.parseInt(match[1] || '0', 10);
          const seconds = Number.parseInt(match[2] || '0', 10);
          const totalSeconds = minutes * 60 + seconds;

          if (totalSeconds <= 1) {
            return '0s';
          }

          const newTotalSeconds = totalSeconds - 1;
          const newMinutes = Math.floor(newTotalSeconds / 60);
          const newSeconds = newTotalSeconds % 60;

          if (newMinutes > 0) {
            return `${newMinutes}m ${newSeconds}s`;
          }
          return `${newSeconds}s`;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, timeRemaining]);

  return (
    <Dialog
      open={open}
      onClose={onExtend} // Allow closing by clicking outside or ESC (extends session)
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={false}
      disableAutoFocus
      disableEnforceFocus
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: 'auto',
            mb: 2,
            borderRadius: '50%',
            bgcolor: 'warning.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Iconify icon="solar:clock-circle-bold" width={32} sx={{ color: 'warning.main' }} />
        </Box>
        <Typography variant="h5">Session Timeout Warning</Typography>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
          Your session will expire due to inactivity in:
        </Typography>
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            color: 'warning.main',
            fontWeight: 'bold',
            mb: 2,
          }}
        >
          {displayTime}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Click &quot;Stay Logged In&quot; to continue your session, or you will be automatically logged out.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0, flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={onExtend}
          startIcon={<Iconify icon="solar:refresh-bold" />}
        >
          Stay Logged In
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="medium"
          onClick={onLogout}
          startIcon={<Iconify icon="solar:logout-2-bold" />}
        >
          Logout Now
        </Button>
      </DialogActions>
    </Dialog>
  );
}
