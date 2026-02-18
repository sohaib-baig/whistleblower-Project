import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface SidebarWidthControlsProps {
  value: 'compact' | 'normal' | 'wide';
  onChange: (value: 'compact' | 'normal' | 'wide') => void;
}

const widthOptions = [
  {
    value: 'compact',
    label: 'Compact',
    description: '200px width',
    icon: 'solar:sidebar-minimalistic-bold',
  },
  {
    value: 'normal',
    label: 'Normal',
    description: '280px width',
    icon: 'solar:sidebar-code-bold',
  },
  {
    value: 'wide',
    label: 'Wide',
    description: '360px width',
    icon: 'solar:sidebar-code-2-bold',
  },
];

export function SidebarWidthControls({ value, onChange }: SidebarWidthControlsProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const getWidthPx = (width: string) => {
    switch (width) {
      case 'compact':
        return 200;
      case 'normal':
        return 280;
      case 'wide':
        return 360;
      default:
        return 280;
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Sidebar Width</Typography>
        <Button
          size="small"
          variant={previewMode ? 'contained' : 'outlined'}
          onClick={() => setPreviewMode(!previewMode)}
          startIcon={<Iconify icon="solar:eye-bold" />}
        >
          {previewMode ? 'Exit Preview' : 'Preview'}
        </Button>
      </Stack>

      <RadioGroup
        value={value}
        onChange={(event) => onChange(event.target.value as 'compact' | 'normal' | 'wide')}
      >
        <Stack spacing={1}>
          {widthOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={
                <Stack direction="row" alignItems="center" spacing={2} sx={{ ml: 1 }}>
                  <Iconify icon={option.icon as any} width={24} />
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
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Preview:
          </Typography>
          <Box
            sx={{
              height: 80,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            {/* Sidebar preview */}
            <Box
              sx={{
                width: getWidthPx(value),
                height: '100%',
                backgroundColor: 'primary.main',
                opacity: 0.3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 12,
              }}
            >
              {getWidthPx(value)}px
            </Box>

            {/* Content area */}
            <Box
              sx={{
                flex: 1,
                height: '100%',
                backgroundColor: 'background.default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                fontSize: 12,
              }}
            >
              Content Area
            </Box>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
