import type { PaletteColorNoChannels } from '../core';

// Extended type to include numeric tones required by MUI
export type PaletteColorWithNumericTones = PaletteColorNoChannels & {
  200: string;
  500: string;
  700: string;
};

import { primary, secondary } from '../core/palette';

// ----------------------------------------------------------------------

export type ThemeColorPreset =
  | 'default'
  | 'preset1'
  | 'preset2'
  | 'preset3'
  | 'preset4'
  | 'preset5';

export const primaryColorPresets: Record<ThemeColorPreset, PaletteColorWithNumericTones> = {
  default: {
    lighter: primary.lighter,
    light: primary.light,
    main: primary.main,
    dark: primary.dark,
    darker: primary.darker,
    contrastText: primary.contrastText,
    200: primary.light,
    500: primary.main,
    700: primary.dark,
  },
  preset1: {
    lighter: '#CCF4FE',
    light: '#68CDF9',
    main: '#078DEE',
    dark: '#0351AB',
    darker: '#012972',
    contrastText: '#FFFFFF',
    200: '#68CDF9',
    500: '#078DEE',
    700: '#0351AB',
  },
  preset2: {
    lighter: '#EBD6FD',
    light: '#B985F4',
    main: '#7635dc',
    dark: '#431A9E',
    darker: '#200A69',
    contrastText: '#FFFFFF',
    200: '#B985F4',
    500: '#7635dc',
    700: '#431A9E',
  },
  preset3: {
    lighter: '#CDE9FD',
    light: '#6BB1F8',
    main: '#0C68E9',
    dark: '#063BA7',
    darker: '#021D6F',
    contrastText: '#FFFFFF',
    200: '#6BB1F8',
    500: '#0C68E9',
    700: '#063BA7',
  },
  preset4: {
    lighter: '#FEF4D4',
    light: '#FED680',
    main: '#fda92d',
    dark: '#B66816',
    darker: '#793908',
    contrastText: '#1C252E',
    200: '#FED680',
    500: '#fda92d',
    700: '#B66816',
  },
  preset5: {
    lighter: '#FFE3D5',
    light: '#FFC1AC',
    main: '#FF3030',
    dark: '#B71833',
    darker: '#7A0930',
    contrastText: '#FFFFFF',
    200: '#FFC1AC',
    500: '#FF3030',
    700: '#B71833',
  },
};

export const secondaryColorPresets: Record<ThemeColorPreset, PaletteColorWithNumericTones> = {
  default: {
    lighter: secondary.lighter,
    light: secondary.light,
    main: secondary.main,
    dark: secondary.dark,
    darker: secondary.darker,
    contrastText: secondary.contrastText,
    200: secondary.light,
    500: secondary.main,
    700: secondary.dark,
  },
  preset1: {
    lighter: '#CAFDEB',
    light: '#61F4D9',
    main: '#00DCDA',
    dark: '#00849E',
    darker: '#004569',
    contrastText: '#FFFFFF',
    200: '#61F4D9',
    500: '#00DCDA',
    700: '#00849E',
  },
  preset2: {
    lighter: '#D6E5FD',
    light: '#85A9F3',
    main: '#3562D7',
    dark: '#1A369A',
    darker: '#0A1967',
    contrastText: '#FFFFFF',
    200: '#85A9F3',
    500: '#3562D7',
    700: '#1A369A',
  },
  preset3: {
    lighter: '#FFF3D8',
    light: '#FFD18B',
    main: '#FFA03F',
    dark: '#B75D1F',
    darker: '#7A2D0C',
    contrastText: '#1C252E',
    200: '#FFD18B',
    500: '#FFA03F',
    700: '#B75D1F',
  },
  preset4: {
    lighter: '#FEEFD5',
    light: '#FBC182',
    main: '#F37F31',
    dark: '#AE4318',
    darker: '#741B09',
    contrastText: '#FFFFFF',
    200: '#FBC182',
    500: '#F37F31',
    700: '#AE4318',
  },
  preset5: {
    lighter: '#FCF0DA',
    light: '#EEC18D',
    main: '#C87941',
    dark: '#904220',
    darker: '#601B0C',
    contrastText: '#FFFFFF',
    200: '#EEC18D',
    500: '#C87941',
    700: '#904220',
  },
};
