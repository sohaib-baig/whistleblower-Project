import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type ILoginPage = {
  id: string | null;
  title: string;
  content: string;
  lastUpdated: IDateValue;
  pageType: string;
};

export type ILoginPageFormData = {
  title?: string | null;
  content: string;
};
