import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type IPrivacyPolicy = {
  id: string;
  title: string;
  content: string;
  lastUpdated: IDateValue;
  pageType: string;
  status?: string;
  language?: string;
};

export type IPrivacyPolicyFormData = {
  title: string;
  content: string;
  status?: string;
  language?: string;
};
