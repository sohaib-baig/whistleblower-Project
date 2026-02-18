import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

interface FontSizeControlsProps {
  baseSize: number;
  scale: number;
  onBaseSizeChange: (size: number) => void;
  onScaleChange: (scale: number) => void;
}

export function FontSizeControls({
  baseSize,
  scale,
  onBaseSizeChange,
  onScaleChange,
}: FontSizeControlsProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const fontSizeOptions = [12, 14, 16, 18, 20, 24];
  const scaleOptions = [1.0, 1.125, 1.2, 1.25, 1.333, 1.5];

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Font Size</Typography>
        <Button
          size="small"
          variant={previewMode ? 'contained' : 'outlined'}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Hide Preview' : 'Preview'}
        </Button>
      </Stack>

      {/* Base Font Size */}
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Base Font Size: {baseSize}px
        </Typography>

        <Slider
          value={baseSize}
          onChange={(_, value) => onBaseSizeChange(value as number)}
          min={10}
          max={24}
          step={1}
          marks={fontSizeOptions.map((size) => ({ value: size, label: `${size}px` }))}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}px`}
        />

        <Stack direction="row" spacing={1}>
          {fontSizeOptions.map((size) => (
            <Button
              key={size}
              size="small"
              variant={baseSize === size ? 'contained' : 'outlined'}
              onClick={() => onBaseSizeChange(size)}
              sx={{ minWidth: 40 }}
            >
              {size}
            </Button>
          ))}
        </Stack>
      </Stack>

      {/* Scale Factor */}
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Scale Factor: {scale}x
        </Typography>

        <Slider
          value={scale}
          onChange={(_, value) => onScaleChange(value as number)}
          min={0.8}
          max={2.0}
          step={0.05}
          marks={scaleOptions.map((scaleValue) => ({ value: scaleValue, label: `${scaleValue}x` }))}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}x`}
        />

        <Stack direction="row" spacing={1}>
          {scaleOptions.map((scaleValue) => (
            <Button
              key={scaleValue}
              size="small"
              variant={scale === scaleValue ? 'contained' : 'outlined'}
              onClick={() => onScaleChange(scaleValue)}
              sx={{ minWidth: 40 }}
            >
              {scaleValue}x
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
          <Box
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.default',
              p: 2,
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: `${baseSize * Math.pow(scale, 3)}px`,
                mb: 1,
              }}
            >
              Heading 1
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontSize: `${baseSize * Math.pow(scale, 2)}px`,
                mb: 1,
              }}
            >
              Heading 2
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontSize: `${baseSize * scale}px`,
                mb: 1,
              }}
            >
              Heading 3
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: `${baseSize}px`,
                mb: 1,
              }}
            >
              Body text - The quick brown fox jumps over the lazy dog
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: `${baseSize / scale}px`,
              }}
            >
              Small text - Lorem ipsum dolor sit amet
            </Typography>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
