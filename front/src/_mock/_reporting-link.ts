import type { IReportingLinkItem } from 'src/types/reporting-link';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const REPORTING_LINK_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const _reportingLinkList: IReportingLinkItem[] = [
  {
    id: _mock.id(1),
    name: 'Default Reporting Channel',
    companyName: 'TechCorp Inc',
    companySlug: 'techcorp',
    url: 'company/techcorp/create-case',
    status: 'active',
    createdAt: _mock.time(1),
    isActive: true,
    createdBy: 'admin@wisling.com',
  },
  {
    id: _mock.id(2),
    name: 'Finance Department Channel',
    companyName: 'Finance Solutions Ltd',
    companySlug: 'finance-solutions',
    url: 'company/finance-solutions/create-case',
    status: 'active',
    createdAt: _mock.time(2),
    isActive: true,
    createdBy: 'admin@wisling.com',
  },
  {
    id: _mock.id(3),
    name: 'HR Reporting Channel',
    companyName: 'Global Enterprises',
    companySlug: 'global-enterprises',
    url: 'company/global-enterprises/create-case',
    status: 'active',
    createdAt: _mock.time(3),
    isActive: true,
    createdBy: 'admin@wisling.com',
  },
  {
    id: _mock.id(4),
    name: 'Legal Department Channel',
    companyName: 'Legal Partners',
    companySlug: 'legal-partners',
    url: 'company/legal-partners/create-case',
    status: 'inactive',
    createdAt: _mock.time(4),
    isActive: false,
    createdBy: 'admin@wisling.com',
  },
  {
    id: _mock.id(5),
    name: 'Compliance Channel',
    companyName: 'Compliance Corp',
    companySlug: 'compliance-corp',
    url: 'company/compliance-corp/create-case',
    status: 'active',
    createdAt: _mock.time(5),
    isActive: true,
    createdBy: 'admin@wisling.com',
  },
];

// Helper function to generate reporting URL
export const generateReportingUrl = (companySlug: string): string =>
  `company/${companySlug}/create-case`;

// Helper function to get company slug from company name
export const generateCompanySlug = (companyName: string): string =>
  companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
