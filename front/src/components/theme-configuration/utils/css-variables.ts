import type { ThemeConfiguration } from 'src/types/theme-configuration';

export const applyCSSVariables = (config: ThemeConfiguration) => {
  const root = document.documentElement;

  // Color variables
  root.style.setProperty('--theme-primary-color', config.primaryColor);
  root.style.setProperty('--theme-secondary-color', config.secondaryColor);
  root.style.setProperty('--theme-background-color', config.backgroundColor);
  root.style.setProperty('--theme-surface-color', config.surfaceColor);
  root.style.setProperty('--theme-text-color', config.textColor);

  // Accent colors
  root.style.setProperty('--theme-success-color', config.accentColors.success);
  root.style.setProperty('--theme-warning-color', config.accentColors.warning);
  root.style.setProperty('--theme-error-color', config.accentColors.error);
  root.style.setProperty('--theme-info-color', config.accentColors.info);

  // Layout variables
  root.style.setProperty('--theme-nav-layout', config.navLayout);
  root.style.setProperty('--theme-sidebar-width', config.sidebarWidth);
  root.style.setProperty('--theme-header-style', config.headerStyle);
  root.style.setProperty('--theme-content-spacing', `${config.contentSpacing}px`);
  root.style.setProperty('--theme-grid-columns', config.gridColumns.toString());
  root.style.setProperty('--theme-grid-gap', `${config.gridGap}px`);

  // Typography variables
  root.style.setProperty('--theme-font-family-primary', config.fontFamily.primary);
  root.style.setProperty('--theme-font-family-secondary', config.fontFamily.secondary);
  root.style.setProperty('--theme-font-size-base', `${config.fontSize.base}px`);
  root.style.setProperty('--theme-font-size-scale', config.fontSize.scale.toString());
  root.style.setProperty('--theme-font-weight-light', config.fontWeight.light.toString());
  root.style.setProperty('--theme-font-weight-normal', config.fontWeight.normal.toString());
  root.style.setProperty('--theme-font-weight-medium', config.fontWeight.medium.toString());
  root.style.setProperty('--theme-font-weight-bold', config.fontWeight.bold.toString());
  root.style.setProperty('--theme-line-height', config.lineHeight.toString());
  root.style.setProperty('--theme-letter-spacing', `${config.letterSpacing}em`);

  // Visual effects variables
  root.style.setProperty('--theme-border-radius', `${config.borderRadius}px`);
  root.style.setProperty('--theme-shadow-intensity', config.shadowIntensity);
  root.style.setProperty('--theme-animations', config.animations ? '1' : '0');
  root.style.setProperty('--theme-blur-intensity', `${config.blurIntensity}px`);
  root.style.setProperty('--theme-transparency', config.transparency.toString());
};

export const getCSSVariable = (variable: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

export const resetCSSVariables = () => {
  const root = document.documentElement;
  const variables = [
    '--theme-primary-color',
    '--theme-secondary-color',
    '--theme-background-color',
    '--theme-surface-color',
    '--theme-text-color',
    '--theme-success-color',
    '--theme-warning-color',
    '--theme-error-color',
    '--theme-info-color',
    '--theme-nav-layout',
    '--theme-sidebar-width',
    '--theme-header-style',
    '--theme-content-spacing',
    '--theme-grid-columns',
    '--theme-grid-gap',
    '--theme-font-family-primary',
    '--theme-font-family-secondary',
    '--theme-font-size-base',
    '--theme-font-size-scale',
    '--theme-font-weight-light',
    '--theme-font-weight-normal',
    '--theme-font-weight-medium',
    '--theme-font-weight-bold',
    '--theme-line-height',
    '--theme-letter-spacing',
    '--theme-border-radius',
    '--theme-shadow-intensity',
    '--theme-animations',
    '--theme-blur-intensity',
    '--theme-transparency',
  ];

  variables.forEach((variable) => {
    root.style.removeProperty(variable);
  });
};
