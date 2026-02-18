import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type ISeverityTableFilters = {
  name: string;
  status: string;
};

export type ISeverityItem = {
  id: string;
  name: string;
  status: string;
  createdAt: IDateValue;
  isActive: boolean;
};

export type ISeverityProfile = {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  createdAt: IDateValue;
};
