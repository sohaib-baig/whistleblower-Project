export type CaseHiddenField =
  | 'dateTime'
  | 'subject'
  | 'description'
  | 'files'
  | 'reportingChannel'
  | 'category'
  | 'assignedTo'
  | 'reportingMedium'
  | 'department'
  | 'severity'
  | 'state';

export type ICaseDetails = {
  id: string;
  caseId: string;
  dateTime: string;
  subject: string;
  description: string;
  category: string;
  reportingMedium: string;
  department: string;
  severity: string;
  state: string;
  hidden_fields?: CaseHiddenField[];
};

export type IReportSetting = {
  assignedTo: string;
  assignStatus: string;
  nextOpenStateDeadline: string;
  nextCloseStateDeadline: string;
  linkWithOtherReport: string;
  autoDeleteAfter30Days: string;
};

export type ILogEntry = {
  id: string;
  actionPerformed: string;
  actionValue: string;
  dateTime: string;
};

export type IDocument = {
  id: string;
  title: string;
  document: string;
  uploadedAt: string;
};

export type INote = {
  id: string;
  title: string;
  description: string;
  date: string;
  addedBy: string;
};

export type IChatMessage = {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
  type: 'user' | 'system';
  messageType?: 'text' | 'audio' | 'image';
  audioUrl?: string;
  imageUrl?: string;
  imageName?: string;
};

export type ISnippet = {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
};
