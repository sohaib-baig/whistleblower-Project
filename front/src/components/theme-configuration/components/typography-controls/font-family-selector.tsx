import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { fontOptions } from '../../constants/color-palettes';

// ----------------------------------------------------------------------

interface FontFamilySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function FontFamilySelector({ value, onChange, label }: FontFamilySelectorProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const selectedFont = fontOptions.find((font) => font.family === value) || fontOptions[0];

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2">{label || 'Font Family'}</Typography>
        <Button
          size="small"
          variant={previewMode ? 'contained' : 'outlined'}
          onClick={() => setPreviewMode(!previewMode)}
        >
          {previewMode ? 'Hide Preview' : 'Preview'}
        </Button>
      </Stack>

      <FormControl fullWidth size="small">
        <InputLabel>Font Family</InputLabel>
        <Select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          label="Font Family"
        >
          {fontOptions.map((font) => (
            <MenuItem key={font.id} value={font.family}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 30,
                    height: 20,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: font.family,
                    fontSize: 12,
                    backgroundColor: 'background.paper',
                  }}
                >
                  Aa
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {font.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {font.category}
                  </Typography>
                </Box>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

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
              fontFamily: selectedFont.family,
              p: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'background.default',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontFamily: selectedFont.family,
                mb: 1,
              }}
            >
              The quick brown fox jumps over the lazy dog
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: selectedFont.family,
                mb: 1,
              }}
            >
              ABCDEFGHIJKLMNOPQRSTUVWXYZ
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: selectedFont.family,
                mb: 1,
              }}
            >
              abcdefghijklmnopqrstuvwxyz
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: selectedFont.family,
              }}
            >
              0123456789 !@#$%^&*()
            </Typography>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
