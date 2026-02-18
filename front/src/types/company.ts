import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type ICompanyTableFilters = {
  name: string;
  status: string;
};

export type ICompanyItem = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  password?: string;
  status: string;
  createdAt: IDateValue;
  isVerified: boolean;
};

export type ICompanyProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  totalEmployees: number;
  isVerified: boolean;
};
