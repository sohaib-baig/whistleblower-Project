import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

import { colorPalettes } from '../../constants/color-palettes';

// ----------------------------------------------------------------------

interface ColorPresetsProps {
  onColorSelect: (color: string) => void;
  selectedColor?: string;
}

export function ColorPresets({ onColorSelect, selectedColor }: ColorPresetsProps) {
  const [expandedPalette, setExpandedPalette] = useState<string | null>(null);

  const handlePaletteClick = (paletteId: string) => {
    setExpandedPalette(expandedPalette === paletteId ? null : paletteId);
  };

  const handleColorClick = (color: string) => {
    onColorSelect(color);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Color Presets</Typography>

      <Grid container spacing={1}>
        {colorPalettes.map((palette) => (
          <Grid key={palette.id} size={{ xs: 6, sm: 4 }}>
            <Button
              variant="outlined"
              onClick={() => handlePaletteClick(palette.id)}
              sx={{
                width: '100%',
                height: 60,
                flexDirection: 'column',
                gap: 0.5,
                p: 1,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: palette.colors.primary,
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              />
              <Typography variant="caption" sx={{ fontSize: 10 }}>
                {palette.name}
              </Typography>
            </Button>
          </Grid>
        ))}
      </Grid>

      {expandedPalette && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {colorPalettes.find((p) => p.id === expandedPalette)?.name} Colors
            </Typography>
            <IconButton size="small" onClick={() => setExpandedPalette(null)}>
              <Iconify icon="solar:close-circle-bold" />
            </IconButton>
          </Stack>

          <Grid container spacing={1}>
            {expandedPalette && colorPalettes.find((p) => p.id === expandedPalette) && (
              <>
                {Object.entries(colorPalettes.find((p) => p.id === expandedPalette)!.colors).map(
                  ([key, color]) => (
                    <Grid key={key} size={{ xs: 6, sm: 4 }}>
                      <Button
                        variant={selectedColor === color ? 'contained' : 'outlined'}
                        onClick={() => handleColorClick(color)}
                        sx={{
                          width: '100%',
                          height: 40,
                          backgroundColor: color,
                          color: 'white',
                          textShadow: '0 0 3px rgba(0,0,0,0.5)',
                          border: `2px solid ${color}`,
                          '&:hover': {
                            backgroundColor: color,
                            opacity: 0.8,
                          },
                        }}
                      >
                        <Stack spacing={0.5} alignItems="center">
                          <Typography
                            variant="caption"
                            sx={{ fontSize: 10, textTransform: 'capitalize' }}
                          >
                            {key}
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: 8 }}>
                            {color.toUpperCase()}
                          </Typography>
                        </Stack>
                      </Button>
                    </Grid>
                  )
                )}
              </>
            )}
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
