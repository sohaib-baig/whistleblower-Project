import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type IDepartmentTableFilters = {
  name: string;
  status: string;
};

export type IDepartmentItem = {
  id: string;
  name: string;
  status: string;
  createdAt: IDateValue;
  isActive: boolean;
};

export type IDepartmentProfile = {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  createdAt: IDateValue;
};
