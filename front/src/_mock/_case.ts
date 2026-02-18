import { fSub, fAdd } from 'src/utils/format-time';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const CASE_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

export const CASE_CATEGORY_OPTIONS = [
  { value: 'abuse_of_power', label: 'Abuse of Power' },
  { value: 'auditors_act', label: 'Auditors Act' },
  { value: 'bribery', label: 'Bribery' },
  { value: 'competition_law', label: 'Competition Law' },
];

export const CASE_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const SAMPLE_COMPANIES = [
  'Acme Corporation',
  'Global Industries Ltd',
  'Tech Solutions Inc',
  'Manufacturing Co',
  'Financial Services Group',
  'Healthcare Systems',
  'Energy Solutions',
  'Retail Enterprises',
  'Construction Ltd',
  'Consulting Firm',
];

const SAMPLE_SUBJECTS = [
  'Regulatory Compliance Investigation',
  'Financial Misconduct Review',
  'Anti-competitive Behavior',
  'Corporate Governance Issues',
  'Audit Irregularities',
  'Ethics Violation Case',
  'Legal Compliance Review',
  'Risk Management Assessment',
  'Internal Investigation',
  'Policy Violation Review',
];

export const _cases = Array.from({ length: 25 }, (_, index) => {
  const statusIndex = index % 4;
  const categoryIndex = index % 4;
  const priorityIndex = index % 3;

  const status = CASE_STATUS_OPTIONS[statusIndex].value;
  const category = CASE_CATEGORY_OPTIONS[categoryIndex].value;
  const priority = CASE_PRIORITY_OPTIONS[priorityIndex].value as 'low' | 'medium' | 'high';

  const createDate = fSub({ days: index * 2 });
  const nextDeadline = fAdd({ days: index * 2 + 7 });
  const lastActivity = fSub({ days: index });

  // Only closed cases have closed date
  const closedDate = status === 'closed' ? fSub({ days: index - 5 }) : undefined;

  return {
    id: _mock.id(index),
    companyId: _mock.id(index % 10), // Assign to one of 10 companies
    companyName: SAMPLE_COMPANIES[index % SAMPLE_COMPANIES.length],
    subject: SAMPLE_SUBJECTS[index % SAMPLE_SUBJECTS.length],
    category,
    status,
    priority,
    nextDeadline,
    lastActivity,
    closedDate,
    description: _mock.sentence(index),
    assignedTo: _mock.fullName(index % 5), // Assign to one of 5 case managers
    caseManagerId: _mock.id(index % 5), // Case manager ID
    createdAt: createDate,
    updatedAt: lastActivity,
  };
});
