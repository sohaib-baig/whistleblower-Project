import type { ReactNode } from 'react';
import type { ThemePreset, ThemeConfiguration } from 'src/types/theme-configuration';

import { useLocalStorage } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';

import { defaultThemePresets } from '../constants/theme-presets';
import { ThemeConfigurationContext } from './theme-configuration-context';
import { defaultThemeConfiguration } from '../constants/default-theme-config';
import { applyCSSVariables, resetCSSVariables } from '../utils/css-variables';

// ----------------------------------------------------------------------

interface ThemeConfigurationProviderProps {
  children: ReactNode;
}

const THEME_CONFIG_STORAGE_KEY = 'theme-configuration';
const THEME_PRESETS_STORAGE_KEY = 'theme-presets';

export function ThemeConfigurationProvider({ children }: ThemeConfigurationProviderProps) {
  const { state: themeConfig, setState: setThemeConfig } = useLocalStorage<ThemeConfiguration>(
    THEME_CONFIG_STORAGE_KEY,
    defaultThemeConfiguration
  );

  const { state: customThemes, setState: setCustomThemes } = useLocalStorage<ThemePreset[]>(
    THEME_PRESETS_STORAGE_KEY,
    []
  );

  const [presets] = useState<ThemePreset[]>(defaultThemePresets);

  // Apply theme configuration to CSS variables
  useEffect(() => {
    applyCSSVariables(themeConfig);
  }, [themeConfig]);

  const applyTheme = useCallback(
    (config: ThemeConfiguration) => {
      setThemeConfig(config);
    },
    [setThemeConfig]
  );

  const savePreset = useCallback(
    (preset: ThemePreset) => {
      const existingIndex = customThemes.findIndex((p) => p.id === preset.id);
      if (existingIndex >= 0) {
        const updated = [...customThemes];
        updated[existingIndex] = preset;
        setCustomThemes(updated);
      } else {
        setCustomThemes([...customThemes, preset]);
      }
    },
    [customThemes, setCustomThemes]
  );

  const deletePreset = useCallback(
    (id: string) => {
      const filtered = customThemes.filter((preset) => preset.id !== id);
      setCustomThemes(filtered);
    },
    [customThemes, setCustomThemes]
  );

  const exportTheme = useCallback(() => JSON.stringify(themeConfig, null, 2), [themeConfig]);

  const importTheme = useCallback(
    (themeData: string) => {
      try {
        const config = JSON.parse(themeData) as ThemeConfiguration;
        // Validate the imported configuration
        if (config && typeof config === 'object') {
          applyTheme(config);
        }
      } catch (error) {
        console.error('Invalid theme data:', error);
        throw new Error('Invalid theme configuration format');
      }
    },
    [applyTheme]
  );

  const resetToDefault = useCallback(() => {
    setThemeConfig(defaultThemeConfiguration);
    resetCSSVariables();
  }, [setThemeConfig]);

  const canReset = JSON.stringify(themeConfig) !== JSON.stringify(defaultThemeConfiguration);

  const contextValue = {
    themeConfig,
    presets,
    customThemes,
    applyTheme,
    savePreset,
    deletePreset,
    exportTheme,
    importTheme,
    resetToDefault,
    canReset,
  };

  return (
    <ThemeConfigurationContext.Provider value={contextValue}>
      {children}
    </ThemeConfigurationContext.Provider>
  );
}
