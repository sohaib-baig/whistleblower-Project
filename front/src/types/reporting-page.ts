export interface IReportingPage {
  id: string;
  title: string;
  content: string;
  lastUpdated: string;
  pageType: string;
  language?: string;
}

export interface IReportingPageFormData {
  title: string;
  content: string;
  language?: string;
}
