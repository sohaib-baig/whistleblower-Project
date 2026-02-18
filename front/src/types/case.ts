import type { IDateValue, IDatePickerControl } from './common';

// ----------------------------------------------------------------------

export type ICaseTableFilters = {
  name: string;
  status: string;
  category: string[];
  endDate: IDatePickerControl;
  startDate: IDatePickerControl;
  open_deadline_period?: string | null;
  close_deadline_period?: string | null;
};

export type ICaseItem = {
  id: string;
  companyId: string;
  companyName: string;
  subject: string;
  category: string;
  status: string;
  nextDeadline: IDateValue;
  lastActivity: IDateValue;
  closedDate?: IDateValue;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  caseManagerId: string;
  createdAt: IDateValue;
};

export type ICase = {
  id: string;
  companyId: string;
  companyName: string;
  subject: string;
  category: string;
  status: string;
  nextDeadline: IDateValue;
  lastActivity: IDateValue;
  closedDate?: IDateValue;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo: string;
  caseManagerId: string;
  createdAt: IDateValue;
  updatedAt: IDateValue;
};
