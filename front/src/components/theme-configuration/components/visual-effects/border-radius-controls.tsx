import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

interface BorderRadiusControlsProps {
  value: number;
  onChange: (value: number) => void;
}

export function BorderRadiusControls({ value, onChange }: BorderRadiusControlsProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const radiusOptions = [0, 4, 8, 12, 16, 24];

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Border Radius</Typography>
        <Button
          size="small"
          variant={previewMode ? 'contained' : 'outlined'}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Hide Preview' : 'Preview'}
        </Button>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Radius: {value}px
        </Typography>

        <Slider
          value={value}
          onChange={(_, newValue) => onChange(newValue as number)}
          min={0}
          max={32}
          step={1}
          marks={radiusOptions.map((radius) => ({ value: radius, label: `${radius}px` }))}
          valueLabelDisplay="auto"
          valueLabelFormat={(val) => `${val}px`}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {radiusOptions.map((radius) => (
            <Button
              key={radius}
              size="small"
              variant={value === radius ? 'contained' : 'outlined'}
              onClick={() => onChange(radius)}
              sx={{ minWidth: 40 }}
            >
              {radius}
            </Button>
          ))}
        </Stack>
      </Stack>

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
            {/* Card preview */}
            <Box
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: `${value}px`,
                backgroundColor: 'background.default',
              }}
            >
              <Typography variant="body2">Card with {value}px border radius</Typography>
            </Box>

            {/* Button preview */}
            <Stack direction="row" spacing={1}>
              <Button variant="contained" sx={{ borderRadius: `${value}px` }}>
                Button
              </Button>
              <Button variant="outlined" sx={{ borderRadius: `${value}px` }}>
                Button
              </Button>
            </Stack>

            {/* Input preview */}
            <Box
              component="input"
              placeholder="Input field"
              sx={{
                p: 1,
                border: 1,
                borderColor: 'divider',
                borderRadius: `${value}px`,
                backgroundColor: 'background.default',
                outline: 'none',
                width: '100%',
                '&:focus': {
                  borderColor: 'primary.main',
                },
              }}
            />
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
