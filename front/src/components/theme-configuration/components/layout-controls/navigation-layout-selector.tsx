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

interface NavigationLayoutSelectorProps {
  value: 'vertical' | 'horizontal' | 'mini';
  onChange: (value: 'vertical' | 'horizontal' | 'mini') => void;
}

const layoutOptions = [
  {
    value: 'vertical',
    label: 'Vertical',
    description: 'Sidebar on the left',
    icon: 'solar:sidebar-minimalistic-bold',
  },
  {
    value: 'horizontal',
    label: 'Horizontal',
    description: 'Navigation at the top',
    icon: 'solar:menu-dots-bold',
  },
  {
    value: 'mini',
    label: 'Mini',
    description: 'Collapsed sidebar',
    icon: 'solar:sidebar-code-bold',
  },
];

export function NavigationLayoutSelector({ value, onChange }: NavigationLayoutSelectorProps) {
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Navigation Layout</Typography>
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
        onChange={(event) => onChange(event.target.value as 'vertical' | 'horizontal' | 'mini')}
      >
        <Stack spacing={1}>
          {layoutOptions.map((option) => (
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
              height: 100,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Preview content based on layout */}
            {value === 'vertical' && (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 60,
                    height: '100%',
                    backgroundColor: 'primary.main',
                    opacity: 0.3,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 70,
                    top: 10,
                    width: 20,
                    height: 20,
                    backgroundColor: 'text.primary',
                    opacity: 0.3,
                    borderRadius: 1,
                  }}
                />
              </>
            )}

            {value === 'horizontal' && (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: 30,
                    backgroundColor: 'primary.main',
                    opacity: 0.3,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 10,
                    top: 40,
                    width: 20,
                    height: 20,
                    backgroundColor: 'text.primary',
                    opacity: 0.3,
                    borderRadius: 1,
                  }}
                />
              </>
            )}

            {value === 'mini' && (
              <>
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 30,
                    height: '100%',
                    backgroundColor: 'primary.main',
                    opacity: 0.3,
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 40,
                    top: 10,
                    width: 20,
                    height: 20,
                    backgroundColor: 'text.primary',
                    opacity: 0.3,
                    borderRadius: 1,
                  }}
                />
              </>
            )}
          </Box>
        </Box>
      )}
    </Stack>
  );
}
