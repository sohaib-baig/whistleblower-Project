import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type IAboutUs = {
  id: string;
  title: string;
  content: string;
  lastUpdated: IDateValue;
  pageType: string;
};

export type IAboutUsFormData = {
  title: string;
  content: string;
};
