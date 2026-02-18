import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const COMPANY_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'banned', label: 'Banned' },
];

export const _companyList = Array.from({ length: 20 }, (_, index) => ({
  id: _mock.id(index),
  name: _mock.companyNames(index),
  email: _mock.email(index),
  phoneNumber: _mock.phoneNumber(index),
  address: _mock.fullAddress(index),
  isVerified: _mock.boolean(index),
  createdAt: _mock.time(index),
  status: (index % 2 && 'pending') || (index % 3 && 'bank_transfer_pending') || 'paid',
}));
