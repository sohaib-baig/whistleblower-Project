export type ISupport = {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  pageType: string;
  status?: string;
  language?: string;
};

export type ISupportFormData = {
  title: string;
  content: string;
  status?: string;
  language?: string;
};
