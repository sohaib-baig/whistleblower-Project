import type { ThemePreset } from 'src/types/theme-configuration';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

interface PresetSelectorProps {
  presets: ThemePreset[];
  customThemes: ThemePreset[];
  selectedPreset?: string;
  onPresetSelect: (preset: ThemePreset) => void;
  onCreateNew: () => void;
}

export function PresetSelector({
  presets,
  customThemes,
  selectedPreset,
  onPresetSelect,
  onCreateNew,
}: PresetSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<'built-in' | 'custom'>('built-in');

  const allPresets = [...presets, ...customThemes];
  const filteredPresets = allPresets.filter((preset) => preset.category === activeCategory);

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">Theme Presets</Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={onCreateNew}
        >
          Create New
        </Button>
      </Stack>

      {/* Category Tabs */}
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant={activeCategory === 'built-in' ? 'contained' : 'outlined'}
          onClick={() => setActiveCategory('built-in')}
        >
          Built-in ({presets.length})
        </Button>
        <Button
          size="small"
          variant={activeCategory === 'custom' ? 'contained' : 'outlined'}
          onClick={() => setActiveCategory('custom')}
        >
          Custom ({customThemes.length})
        </Button>
      </Stack>

      {/* Preset Grid */}
      <Grid container spacing={2}>
        {filteredPresets.map((preset) => (
          <Grid key={preset.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedPreset === preset.id ? 2 : 1,
                borderColor: selectedPreset === preset.id ? 'primary.main' : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 2,
                },
              }}
              onClick={() => onPresetSelect(preset)}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={2}>
                  {/* Preview */}
                  <Box
                    sx={{
                      height: 80,
                      borderRadius: 1,
                      backgroundColor: preset.configuration.backgroundColor,
                      border: 1,
                      borderColor: 'divider',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Sidebar preview */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 20,
                        height: '100%',
                        backgroundColor: preset.configuration.primaryColor,
                      }}
                    />

                    {/* Content preview */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 25,
                        top: 10,
                        width: 30,
                        height: 8,
                        backgroundColor: preset.configuration.textColor,
                        borderRadius: 0.5,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 25,
                        top: 25,
                        width: 20,
                        height: 6,
                        backgroundColor: preset.configuration.textColor,
                        opacity: 0.7,
                        borderRadius: 0.5,
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 25,
                        top: 40,
                        width: 25,
                        height: 6,
                        backgroundColor: preset.configuration.textColor,
                        opacity: 0.5,
                        borderRadius: 0.5,
                      }}
                    />
                  </Box>

                  {/* Preset Info */}
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" noWrap>
                        {preset.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={preset.category}
                        color={preset.category === 'built-in' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant="caption" color="text.secondary" noWrap>
                      {preset.description}
                    </Typography>
                  </Stack>

                  {/* Color Palette Preview */}
                  <Stack direction="row" spacing={0.5}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: preset.configuration.primaryColor,
                        borderRadius: '50%',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: preset.configuration.secondaryColor,
                        borderRadius: '50%',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: preset.configuration.accentColors.success,
                        borderRadius: '50%',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: preset.configuration.accentColors.warning,
                        borderRadius: '50%',
                        border: 1,
                        borderColor: 'divider',
                      }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPresets.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            color: 'text.secondary',
          }}
        >
          <Iconify icon="solar:palette-bold" width={48} sx={{ mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">No {activeCategory} presets available</Typography>
        </Box>
      )}
    </Stack>
  );
}
