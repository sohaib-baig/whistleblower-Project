import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type IPaymentPage = {
  id: string | null;
  title: string;
  content: string;
  lastUpdated: IDateValue;
  pageType: string;
};

export type IPaymentPageFormData = {
  title: string;
  content: string;
};


