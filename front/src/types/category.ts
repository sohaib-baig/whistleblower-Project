import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type ICategoryTableFilters = {
  name: string;
  status: string;
};

export type ICategoryItem = {
  id: string;
  name: string;
  status: string;
  createdAt: IDateValue;
  isActive: boolean;
};

export type ICategoryProfile = {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  createdAt: IDateValue;
};
