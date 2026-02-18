import type { IDateValue } from './common';

// ----------------------------------------------------------------------

export type IStateTableFilters = {
  name: string;
  status: string;
};

export type IStateItem = {
  id: string;
  name: string;
  status: string;
  createdAt: IDateValue;
  isActive: boolean;
};

export type IStateProfile = {
  id: string;
  name: string;
  status: string;
  isActive: boolean;
  createdAt: IDateValue;
};
