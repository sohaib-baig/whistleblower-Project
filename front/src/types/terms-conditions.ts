export type ITermsConditions = {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  pageType: string;
  status?: string;
  language?: string;
};

export type ITermsConditionsFormData = {
  title: string;
  content: string;
  status?: string;
  language?: string;
};
