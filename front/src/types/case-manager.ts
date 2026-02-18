import type { IDateValue } from './common';

export type ICaseManagerTableFilters = {
  name: string;
  email: string;
  status: string;
};

export type ICaseManagerItem = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: IDateValue;
  updatedAt: IDateValue;
};

export type ICaseManager = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: IDateValue;
  updatedAt: IDateValue;
};
