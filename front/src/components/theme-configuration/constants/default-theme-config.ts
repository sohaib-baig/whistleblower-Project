import type { ThemeConfiguration } from 'src/types/theme-configuration';

export const defaultThemeConfiguration: ThemeConfiguration = {
  // Color Scheme
  primaryColor: '#1976d2',
  secondaryColor: '#dc004e',
  backgroundColor: '#ffffff',
  surfaceColor: '#f5f5f5',
  textColor: '#212121',
  accentColors: {
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
  },

  // Layout
  navLayout: 'vertical',
  sidebarWidth: 'normal',
  headerStyle: 'fixed',
  contentSpacing: 24,
  gridColumns: 12,
  gridGap: 16,

  // Typography
  fontFamily: {
    primary: 'Roboto, sans-serif',
    secondary: 'Roboto, sans-serif',
  },
  fontSize: {
    base: 16,
    scale: 1.2,
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: 1.5,
  letterSpacing: 0,

  // Visual Effects
  borderRadius: 8,
  shadowIntensity: 'medium',
  animations: true,
  blurIntensity: 0,
  transparency: 1,
};
