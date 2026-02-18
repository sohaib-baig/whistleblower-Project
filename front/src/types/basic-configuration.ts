export interface BasicConfiguration {
  id: string;
  logo?: string; // Base64 or file path
  smallLogo?: string; // Base64 or file path
  defaultOpenStateDeadline: number;
  defaultClosedStateDeadline: number;
  invoiceNote?: string;
  vat: number;
  price: number;
  phoneHoursFrom: string; // HH:MM format
  phoneHoursTo: string; // HH:MM format
  deleteClosedCases: boolean;
  deleteClosedCasesPeriod?: number | null;
  deleteClosedCasesPeriodType?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BasicConfigurationFormValues {
  logo?: File;
  smallLogo?: File;
  defaultOpenStateDeadline: number;
  defaultClosedStateDeadline: number;
  invoiceNote?: string;
  vat: number;
  price: number;
  phoneHoursFrom: string;
  phoneHoursTo: string;
  deleteClosedCases: boolean;
  deleteClosedCasesPeriod?: number | null;
  deleteClosedCasesPeriodType?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
}
