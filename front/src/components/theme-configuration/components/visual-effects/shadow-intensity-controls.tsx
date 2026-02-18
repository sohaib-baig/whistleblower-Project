import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

// ----------------------------------------------------------------------

interface ShadowIntensityControlsProps {
  value: 'none' | 'light' | 'medium' | 'heavy';
  onChange: (value: 'none' | 'light' | 'medium' | 'heavy') => void;
}

const shadowOptions = [
  {
    value: 'none',
    label: 'None',
    description: 'No shadows',
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Subtle shadows',
  },
  {
    value: 'medium',
    label: 'Medium',
    description: 'Balanced shadows',
  },
  {
    value: 'heavy',
    label: 'Heavy',
    description: 'Prominent shadows',
  },
];

const getShadowStyle = (intensity: string) => {
  switch (intensity) {
    case 'none':
      return 'none';
    case 'light':
      return '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
    case 'medium':
      return '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)';
    case 'heavy':
      return '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)';
    default:
      return 'none';
  }
};

export function ShadowIntensityControls({ value, onChange }: ShadowIntensityControlsProps) {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Shadow Intensity</Typography>
        <Button
          size="small"
          variant={previewMode ? 'contained' : 'outlined'}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Hide Preview' : 'Preview'}
        </Button>
      </Stack>

      <RadioGroup
        value={value}
        onChange={(event) => onChange(event.target.value as 'none' | 'light' | 'medium' | 'heavy')}
      >
        <Stack spacing={1}>
          {shadowOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={
                <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 20,
                      backgroundColor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      boxShadow: getShadowStyle(option.value),
                    }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {option.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Stack>
              }
              sx={{
                border: 1,
                borderColor: value === option.value ? 'primary.main' : 'divider',
                borderRadius: 1,
                p: 1,
                m: 0,
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            />
          ))}
        </Stack>
      </RadioGroup>

      {previewMode && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            backgroundColor: 'background.paper',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Preview:
          </Typography>
          <Stack spacing={2}>
            {/* Card with shadow */}
            <Box
              sx={{
                p: 2,
                backgroundColor: 'background.default',
                borderRadius: 1,
                boxShadow: getShadowStyle(value),
              }}
            >
              <Typography variant="body2">Card with {value} shadow</Typography>
            </Box>

            {/* Button with shadow */}
            <Button
              variant="contained"
              sx={{
                boxShadow: getShadowStyle(value),
                alignSelf: 'flex-start',
              }}
            >
              Button with shadow
            </Button>

            {/* Floating element */}
            <Box
              sx={{
                width: 60,
                height: 60,
                backgroundColor: 'primary.main',
                borderRadius: '50%',
                boxShadow: getShadowStyle(value),
                alignSelf: 'center',
              }}
            />
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
