import { useContext } from 'react';

import { ThemeConfigurationContext } from '../context/theme-configuration-context';

export function useThemeConfiguration() {
  const context = useContext(ThemeConfigurationContext);

  if (!context) {
    throw new Error('useThemeConfiguration must be used within a ThemeConfigurationProvider');
  }

  return context;
}
