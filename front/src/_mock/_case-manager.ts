import { fSub } from 'src/utils/format-time';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const CASE_MANAGER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const SAMPLE_NAMES = [
  'John Smith',
  'Sarah Johnson',
  'Michael Brown',
  'Emily Davis',
  'David Wilson',
  'Lisa Anderson',
  'Robert Taylor',
  'Jennifer Martinez',
  'William Garcia',
  'Ashley Rodriguez',
  'Christopher Lee',
  'Amanda White',
  'Daniel Harris',
  'Jessica Clark',
  'Matthew Lewis',
  'Nicole Walker',
  'Andrew Hall',
  'Samantha Allen',
  'James Young',
  'Rachel King',
];

const SAMPLE_EMAILS = [
  'john.smith@company.com',
  'sarah.johnson@company.com',
  'michael.brown@company.com',
  'emily.davis@company.com',
  'david.wilson@company.com',
  'lisa.anderson@company.com',
  'robert.taylor@company.com',
  'jennifer.martinez@company.com',
  'william.garcia@company.com',
  'ashley.rodriguez@company.com',
  'christopher.lee@company.com',
  'amanda.white@company.com',
  'daniel.harris@company.com',
  'jessica.clark@company.com',
  'matthew.lewis@company.com',
  'nicole.walker@company.com',
  'andrew.hall@company.com',
  'samantha.allen@company.com',
  'james.young@company.com',
  'rachel.king@company.com',
];

const SAMPLE_PHONES = [
  '+1-555-0101',
  '+1-555-0102',
  '+1-555-0103',
  '+1-555-0104',
  '+1-555-0105',
  '+1-555-0106',
  '+1-555-0107',
  '+1-555-0108',
  '+1-555-0109',
  '+1-555-0110',
  '+1-555-0111',
  '+1-555-0112',
  '+1-555-0113',
  '+1-555-0114',
  '+1-555-0115',
  '+1-555-0116',
  '+1-555-0117',
  '+1-555-0118',
  '+1-555-0119',
  '+1-555-0120',
];

export const _caseManagers = Array.from({ length: 20 }, (_, index) => {
  const statusIndex = index % 3;
  const status = CASE_MANAGER_STATUS_OPTIONS[statusIndex].value;
  const createDate = fSub({ days: index * 3 });
  const updateDate = fSub({ days: index * 2 });

  return {
    id: _mock.id(index),
    name: SAMPLE_NAMES[index % SAMPLE_NAMES.length],
    email: SAMPLE_EMAILS[index % SAMPLE_EMAILS.length],
    phone: SAMPLE_PHONES[index % SAMPLE_PHONES.length],
    status,
    isVerified: _mock.boolean(index),
    isActive: _mock.boolean(index + 1),
    createdAt: createDate,
    updatedAt: updateDate,
  };
});
