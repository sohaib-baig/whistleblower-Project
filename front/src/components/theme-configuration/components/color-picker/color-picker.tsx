import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
}

export function ColorPicker({ value, onChange, label, disabled }: ColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempColor, setTempColor] = useState(value);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setTempColor(value);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleApply = () => {
    onChange(tempColor);
    handleClose();
  };

  const handleCancel = () => {
    setTempColor(value);
    handleClose();
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTempColor(event.target.value);
  };

  return (
    <>
      <Stack spacing={1}>
        {label && (
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        )}

        <Button
          variant="outlined"
          onClick={handleClick}
          disabled={disabled}
          sx={{
            width: '100%',
            height: 40,
            border: `2px solid ${value}`,
            backgroundColor: value,
            color: 'white',
            textShadow: '0 0 3px rgba(0,0,0,0.5)',
            '&:hover': {
              backgroundColor: value,
              opacity: 0.8,
            },
          }}
        >
          {value.toUpperCase()}
        </Button>
      </Stack>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCancel}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, minWidth: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Choose Color
          </Typography>

          <Stack spacing={2}>
            <Box
              sx={{
                width: '100%',
                height: 60,
                backgroundColor: tempColor,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Hex Color"
              value={tempColor}
              onChange={handleColorChange}
              placeholder="#000000"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>#</Typography>,
              }}
            />

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleCancel} sx={{ flex: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleApply} sx={{ flex: 1 }}>
                Apply
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
