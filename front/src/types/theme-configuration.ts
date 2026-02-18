export interface ThemeConfiguration {
  // Color Scheme
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentColors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Layout
  navLayout: 'vertical' | 'horizontal' | 'mini';
  sidebarWidth: 'compact' | 'normal' | 'wide';
  headerStyle: 'fixed' | 'static' | 'floating';
  contentSpacing: number;
  gridColumns: number;
  gridGap: number;

  // Typography
  fontFamily: {
    primary: string;
    secondary: string;
  };
  fontSize: {
    base: number;
    scale: number;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    bold: number;
  };
  lineHeight: number;
  letterSpacing: number;

  // Visual Effects
  borderRadius: number;
  shadowIntensity: 'none' | 'light' | 'medium' | 'heavy';
  animations: boolean;
  blurIntensity: number;
  transparency: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  configuration: ThemeConfiguration;
  preview: string; // Base64 image or CSS
  category: 'built-in' | 'custom' | 'community';
}

export interface ThemeConfigurationContextValue {
  themeConfig: ThemeConfiguration;
  presets: ThemePreset[];
  customThemes: ThemePreset[];
  applyTheme: (config: ThemeConfiguration) => void;
  savePreset: (preset: ThemePreset) => void;
  deletePreset: (id: string) => void;
  exportTheme: () => string;
  importTheme: (themeData: string) => void;
  resetToDefault: () => void;
  canReset: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'serif' | 'sans-serif' | 'monospace' | 'display';
  preview: string;
}
