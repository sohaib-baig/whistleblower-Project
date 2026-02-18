import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type IReportingLinkTableFilters = {
  name: string;
  status: string;
};

export type IReportingLinkItem = {
  id: string;
  name: string;
  companyName: string;
  companySlug: string;
  url: string;
  status: string;
  createdAt: IDateValue;
  isActive: boolean;
  createdBy: string;
};

export type IReportingLinkProfile = {
  id: string;
  name: string;
  companyName: string;
  companySlug: string;
  url: string;
  status: string;
  isActive: boolean;
  createdAt: IDateValue;
  createdBy: string;
};
