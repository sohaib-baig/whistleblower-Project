import type {
  INote,
  ISnippet,
  ILogEntry,
  IDocument,
  ICaseDetails,
  IChatMessage,
} from 'src/types/case-details';

import { fSub } from 'src/utils/format-time';

import { _mock } from './_mock';

export const CASE_DETAILS_MOCK: ICaseDetails = {
  id: '1',
  caseId: 'N01O2TK177',
  dateTime: '22-08-2025 10:00 AM',
  subject: 'Test Case 11111',
  description: 'Test Case 11111',
  category: 'Other',
  reportingMedium: 'Written & Oral',
  department: 'Low',
  severity: 'Low',
  state: 'Low',
};

export const ASSIGNED_USERS = [
  { value: 'user1', label: 'User 1' },
  { value: 'user2', label: 'User 2' },
  { value: 'user3', label: 'User 3' },
];

export const ASSIGN_STATUS_OPTIONS = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

export const AUTO_DELETE_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const _logs: ILogEntry[] = Array.from({ length: 10 }, (_, index) => ({
  id: _mock.id(index),
  actionPerformed: `Action ${index + 1} Performed`,
  actionValue: `Value ${index + 1}`,
  dateTime: fSub({ days: index }),
}));

export const _documents: IDocument[] = Array.from({ length: 5 }, (_, index) => ({
  id: _mock.id(index),
  title: `Document ${index + 1}`,
  document: `document_${index + 1}.pdf`,
  uploadedAt: fSub({ days: index }),
}));

export const _notes: INote[] = Array.from({ length: 8 }, (_, index) => ({
  id: _mock.id(index),
  title: `Note ${index + 1}`,
  description: `Description for note ${index + 1}`,
  date: fSub({ days: index }),
  addedBy: `User ${index + 1}`,
}));

export const _chatMessages: IChatMessage[] = [
  {
    id: '1',
    message: 'Hello, how can I help you?',
    sender: 'System',
    timestamp: '10:00 AM',
    type: 'system',
    messageType: 'text',
  },
  {
    id: '2',
    message: 'I need assistance with this case.',
    sender: 'John Doe',
    timestamp: '10:05 AM',
    type: 'user',
    messageType: 'text',
  },
];

export const _snippets: ISnippet[] = [
  {
    id: '1',
    title: 'Case Update Request',
    content: 'Please provide an update on the current status of this case.',
    createdBy: 'Admin',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    title: 'Document Review',
    content: 'The submitted documents have been reviewed and approved.',
    createdBy: 'Company',
    createdAt: '2024-01-16',
  },
  {
    id: '3',
    title: 'Follow-up Required',
    content: 'A follow-up meeting has been scheduled for next week.',
    createdBy: 'Case Manager',
    createdAt: '2024-01-17',
  },
  {
    id: '4',
    title: 'Status Change',
    content: 'Case status has been updated to "In Progress".',
    createdBy: 'Admin',
    createdAt: '2024-01-18',
  },
  {
    id: '5',
    title: 'Deadline Reminder',
    content: 'Please note that the deadline for this case is approaching.',
    createdBy: 'System',
    createdAt: '2024-01-19',
  },
];
