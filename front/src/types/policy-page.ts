// ----------------------------------------------------------------------

export type IPolicyPage = {
  id: string | null;
  title: string;
  content: string;
  lastUpdated: string | null;
  pageType: string;
};

export type IPolicyPageFormData = {
  title?: string;
  content: string;
};




