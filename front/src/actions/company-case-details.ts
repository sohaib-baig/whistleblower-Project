// ----------------------------------------------------------------------

import type { CaseHiddenField } from 'src/types/case-details';

import { getPasswordSession } from 'src/utils/password-session';

import axios from 'src/lib/axios';
import sanctum, { initSanctumCsrf } from 'src/lib/axios-sanctum';

// ----------------------------------------------------------------------

export interface CaseDetails {
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
}

export interface ReportSetting {
  assignedTo: string;
  assignStatus: string;
  nextOpenStateDeadline: string;
  nextCloseStateDeadline: string;
  linkWithOtherReport: string;
  autoDeleteAfter30Days: string;
}

// ----------------------------------------------------------------------

export const fetchCompanyCaseDetails = async (
  caseId: string,
  userId: string,
  companySlug: string
): Promise<CaseDetails> => {
  try {
    const session = getPasswordSession(companySlug);
    if (!session) {
      throw new Error('No valid session found');
    }

    // TODO: Replace with actual API call
    // const response = await fetch(`/api/company/${companySlug}/cases/${caseId}`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${session.password}`,
    //     'X-User-ID': userId,
    //     'Content-Type': 'application/json',
    //   },
    // });

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    // return response.json();

    // Mock data for now
    return {
      caseId,
      dateTime: new Date().toISOString(),
      subject: 'Sample Case Subject',
      description: 'This is a sample case description for testing purposes.',
      category: 'Fraud',
      reportingMedium: 'Online Form',
      department: 'Finance',
      severity: 'High',
      state: 'Open',
    };
  } catch (error) {
    console.error('Error fetching case details:', error);
    throw new Error('Failed to fetch case details');
  }
};

export const saveReportSettings = async (
  caseId: string,
  userId: string,
  companySlug: string,
  settings: ReportSetting
): Promise<void> => {
  try {
    const session = getPasswordSession(companySlug);
    if (!session) {
      throw new Error('No valid session found');
    }

    // TODO: Replace with actual API call
    // const response = await fetch(`/api/company/${companySlug}/cases/${caseId}/settings`, {
    //   method: 'PUT',
    //   headers: {
    //     'Authorization': `Bearer ${session.password}`,
    //     'X-User-ID': userId,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(settings),
    // });

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

  } catch (error) {
    console.error('Error saving report settings:', error);
    throw new Error('Failed to save report settings');
  }
};

export async function updateCaseAttributes(
  caseId: string,
  payload: {
    department_id?: string | null;
    severity_id?: string | null;
    state_id?: string | null;
  }
): Promise<any> {
  await initSanctumCsrf();
  const response = await sanctum.put(`/api/v1/cases/${caseId}/attributes`, payload);
  return response.data;
}

export async function updateCaseHiddenFields(
  caseId: string,
  hiddenFields: CaseHiddenField[]
): Promise<CaseHiddenField[]> {
  await initSanctumCsrf();
  // Ensure hidden_fields is always an array (even if empty) to satisfy API validation
  const payload = {
    hidden_fields: Array.isArray(hiddenFields) ? hiddenFields : [],
  };
  
  try {
    const response = await sanctum.put(`/api/v1/cases/${caseId}/hidden-fields`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response?.data?.data?.hidden_fields ?? hiddenFields;
  } catch (error: any) {
    console.error('❌ updateCaseHiddenFields error:', {
      error,
      response: error?.response?.data,
      status: error?.response?.status,
      payload,
    });
    throw error;
  }
}

export const uploadDocument = async (
  caseId: string,
  userId: string,
  companySlug: string,
  file: File,
  title: string
): Promise<void> => {
  try {
    const session = getPasswordSession(companySlug);
    if (!session) {
      throw new Error('No valid session found');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('caseId', caseId);
    formData.append('userId', userId);

    // TODO: Replace with actual API call
    // const response = await fetch(`/api/company/${companySlug}/cases/${caseId}/documents`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${session.password}`,
    //     'X-User-ID': userId,
    //   },
    //   body: formData,
    // });

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  }
};

export interface CaseNote {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CaseNotesResponse {
  status: boolean;
  message: string;
  data?: CaseNote[];
}

export const getCaseNotes = async (caseId: string): Promise<CaseNote[]> => {
  try {
    const res = await axios.get(`/api/v1/public/cases/${caseId}/notes`);
    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to fetch notes');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to fetch notes');
  }
};

export const addNote = async (
  caseId: string,
  userId: string,
  companySlug: string,
  title: string,
  description: string
): Promise<CaseNote> => {
  try {
    const res = await axios.post('/api/v1/public/cases/notes', {
      case_id: caseId,
      title: title.trim(),
      description: description.trim(),
    });

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to add note');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to add note');
  }
};

export const updateNote = async (
  noteId: string,
  title: string,
  description: string
): Promise<CaseNote> => {
  try {
    const res = await axios.put(`/api/v1/public/cases/notes/${noteId}`, {
      title: title.trim(),
      description: description.trim(),
    });

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to update note');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to update note');
  }
};

export const deleteNote = async (noteId: string): Promise<void> => {
  try {
    const res = await axios.delete(`/api/v1/public/cases/notes/${noteId}`);
    const data: any = (res as any)?.data ?? null;
    if (!data?.status) {
      throw new Error(data?.message || 'Failed to delete note');
    }
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to delete note');
  }
};

export interface CaseChatMessage {
  id: string;
  message: string;
  type: 'text' | 'audio' | 'image';
  sender: string;
  timestamp: string;
  read_status: boolean;
  created_by: string | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CaseChatsResponse {
  status: boolean;
  message: string;
  data?: CaseChatMessage[];
}

export interface LegalSupportMessage {
  id: string;
  message: string;
  type: 'text' | 'audio' | 'image';
  sender: string | null;
  timestamp: string | null;
  read_status: boolean;
  created_by: string | null;
  creator?: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
  } | null;
}

export const getCaseChats = async (caseId: string): Promise<CaseChatMessage[]> => {
  try {
    const res = await axios.get(`/api/v1/public/cases/${caseId}/chats`);
    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to fetch chat messages');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to fetch chat messages');
  }
};

export const getUnreadChatCount = async (caseId: string): Promise<number> => {
  try {
    const res = await axios.get(`/api/v1/public/cases/${caseId}/chats/unread-count`);
    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data?.unread_count !== undefined) {
      return data.data.unread_count;
    }
    return 0;
  } catch (error: any) {
    console.error('Error fetching unread chat count:', error);
    return 0;
  }
};

export const markChatMessagesAsRead = async (caseId: string): Promise<void> => {
  try {
    // This route is now CSRF-exempt, so we can make the request directly
    await axios.put(`/api/v1/public/cases/${caseId}/chats/mark-read`, {});
  } catch (error: any) {
    console.error('Error marking chat messages as read:', error);
    // Don't throw - this is a non-critical operation
  }
};

export const sendChatMessage = async (
  caseId: string,
  message: string
): Promise<CaseChatMessage> => {
  try {
    // Client-side validation
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (message.trim().length > 10000) {
      throw new Error('Message must not exceed 10,000 characters');
    }

    const res = await axios.post('/api/v1/public/cases/chats', {
      case_id: caseId,
      message: message.trim(),
    });

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to send message');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to send message');
  }
};

export const sendChatAudio = async (caseId: string, audioFile: Blob): Promise<CaseChatMessage> => {
  try {
    // Client-side validation
    if (audioFile.size === 0) {
      throw new Error('Audio file is empty');
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      throw new Error('Audio file size must not exceed 10MB');
    }

    // Get the MIME type from the blob, default to webm if not set
    let mimeType = audioFile.type || 'audio/webm';

    // Normalize MIME type - remove codec info and ensure it's a base type
    if (mimeType.includes(';')) {
      mimeType = mimeType.split(';')[0].trim();
    }

    // Map to supported types
    const supportedTypes: { [key: string]: string } = {
      'audio/webm': 'audio/webm',
      'audio/wav': 'audio/wav',
      'audio/x-wav': 'audio/wav',
      'audio/wave': 'audio/wav',
      'audio/mpeg': 'audio/mpeg',
      'audio/mp3': 'audio/mp3',
      'audio/x-mpeg': 'audio/mpeg',
      'audio/ogg': 'audio/ogg',
      'audio/opus': 'audio/ogg',
    };

    // Use mapped type if available, otherwise use webm as default
    mimeType = supportedTypes[mimeType] || 'audio/webm';

    // Determine file extension based on MIME type
    let extension = 'webm';
    if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) extension = 'mp3';
    else if (mimeType.includes('ogg')) extension = 'ogg';
    else if (mimeType.includes('webm')) extension = 'webm';


    // Create a File object with the correct MIME type and extension
    const file = new File([audioFile], `audio.${extension}`, { type: mimeType });

    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('audio', file, `audio.${extension}`);

    const res = await axios.post('/api/v1/public/cases/chats/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to send audio message');
  } catch (error: any) {
    console.error('Error sending audio:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        // Laravel validation errors
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to send audio message');
      }
      throw new Error(errorData.message || 'Failed to send audio message');
    }
    throw new Error(error.message || 'Failed to send audio message');
  }
};

export interface CaseLogEntry {
  id: string;
  action_type: string;
  action_value: string | null;
  created_at: string;
  created_by: string | null;
  creator?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export const getCaseLogs = async (caseId: string): Promise<CaseLogEntry[]> => {
  try {
    const res = await axios.get(`/api/v1/public/cases/${caseId}/logs`);
    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to fetch case logs');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to fetch case logs');
  }
};

export interface CaseListItem {
  id: string;
  case_id: string;
  title?: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  open_deadline_number?: number | null;
  open_deadline_period?: string | null;
  close_deadline_number?: number | null;
  close_deadline_period?: string | null;
  company?: {
    id: string;
    name: string;
  } | null;
  case_manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface CasesListResponse {
  status: boolean;
  message: string;
  data?: CaseListItem[];
}

export const getCasesList = async (): Promise<CaseListItem[]> => {
  try {
    const res = await axios.get('/api/v1/cases');
    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to fetch cases list');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to fetch cases list');
  }
};

export interface UpdateReportSettingsData {
  case_manager_id?: string | null;
  status: string;
  open_deadline_number?: number | null;
  open_deadline_period?: string | null;
  close_deadline_number?: number | null;
  close_deadline_period?: string | null;
  other_report_link?: string | null;
  automatic_delete?: boolean | null;
  case_category_id?: string | null;
  reporting_medium?: string | null;
  department_id?: string | null;
  severity_id?: string | null;
  state_id?: string | null;
}

export interface ReportSettingsResponse {
  id: string;
  case_manager_id: string | null;
  case_manager_name: string | null;
  status: string;
  open_deadline_time: string | null;
  close_deadline_time: string | null;
  other_report_link: string | null;
  automatic_delete: boolean | null;
}

export interface CaseAttachment {
  id: string;
  attachment_name: string;
  attachment_type: string;
  attachment_path: string;
  created_at?: string;
}

export const getCaseAttachments = async (caseId: string): Promise<CaseAttachment[]> => {
  try {
    const res = await sanctum.get(`/api/v1/cases/${caseId}/attachments`);
    const responseData: any = (res as any)?.data ?? null;
    // The sanctum interceptor already extracted the data
    if (Array.isArray(responseData)) {
      return responseData;
    }
    throw new Error('Failed to fetch attachments: Invalid response format');
  } catch (error: any) {
    console.error('Error fetching attachments:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to fetch attachments');
      }
      throw new Error(errorData.message || 'Failed to fetch attachments');
    }
    throw new Error(error.message || 'Failed to fetch attachments');
  }
};

export const uploadCaseAttachment = async (
  caseId: string,
  file: File,
  attachmentName: string
): Promise<CaseAttachment> => {
  try {
    // Client-side validation
    if (!attachmentName.trim()) {
      throw new Error('Document name is required');
    }

    if (attachmentName.trim().length > 255) {
      throw new Error('Document name must not exceed 255 characters');
    }

    if (!file) {
      throw new Error('File is required');
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must not exceed 10MB');
    }

    // Validate file type
    const allowedTypes = [
      'pdf',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
      'txt',
      'jpg',
      'jpeg',
      'png',
      'gif',
    ];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      throw new Error(
        'Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF'
      );
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('case_id', caseId);
    formData.append('attachment_name', attachmentName.trim());

    // Don't set Content-Type manually - axios will set it automatically with the correct boundary
    const res = await sanctum.post('/api/v1/cases/attachments', formData);

    const responseData: any = (res as any)?.data ?? null;
    if (responseData) {
      return responseData as CaseAttachment;
    }
    throw new Error('Failed to upload attachment: No data received');
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to upload attachment');
      }
      throw new Error(errorData.message || 'Failed to upload attachment');
    }
    throw new Error(error.message || 'Failed to upload attachment');
  }
};

export const deleteCaseAttachment = async (attachmentId: string): Promise<void> => {
  try {
    await sanctum.delete(`/api/v1/cases/attachments/${attachmentId}`);
  } catch (error: any) {
    console.error('Error deleting attachment:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.message || 'Failed to delete attachment');
    }
    throw new Error(error.message || 'Failed to delete attachment');
  }
};

// Authenticated note actions (for backend dashboard)
export const getCaseNotesAuthenticated = async (caseId: string): Promise<CaseNote[]> => {
  try {
    const res = await sanctum.get(`/api/v1/cases/${caseId}/notes`);
    const responseData: any = (res as any)?.data ?? null;

    // The sanctum interceptor already extracted the data from {status, message, data}
    // So responseData should be the array directly
    if (Array.isArray(responseData)) {
      return responseData;
    }

    // Fallback: if responseData is not an array, it might still be wrapped
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      const unwrappedData = (responseData as any).data;
      if (Array.isArray(unwrappedData)) {
        return unwrappedData;
      }
    }

    // Return empty array if no valid data found instead of throwing error
    // This handles cases where the API returns success but with empty/null data
    if (responseData === null || responseData === undefined) {
      console.warn('Notes API returned null/undefined data');
      return [];
    }

    // If we get here, the response format is unexpected
    console.error('Unexpected notes response format:', responseData);
    throw new Error('Failed to fetch notes: Invalid response format');
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to fetch notes');
      }
      throw new Error(errorData.message || 'Failed to fetch notes');
    }
    throw new Error(error.message || 'Failed to fetch notes');
  }
};

export const addNoteAuthenticated = async (
  caseId: string,
  title: string,
  description: string
): Promise<CaseNote> => {
  try {
    // Client-side validation
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      throw new Error('Note title is required');
    }

    if (!trimmedDescription) {
      throw new Error('Note description is required');
    }

    const res = await sanctum.post('/api/v1/cases/notes', {
      case_id: caseId,
      title: trimmedTitle,
      description: trimmedDescription,
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData) {
      return responseData as CaseNote;
    }
    throw new Error('Failed to add note: No data received');
  } catch (error: any) {
    console.error('Error adding note:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to add note');
      }
      throw new Error(errorData.message || 'Failed to add note');
    }
    throw new Error(error.message || 'Failed to add note');
  }
};

export const updateNoteAuthenticated = async (
  noteId: string,
  title: string,
  description: string
): Promise<CaseNote> => {
  try {
    // Client-side validation
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      throw new Error('Note title is required');
    }

    if (!trimmedDescription) {
      throw new Error('Note description is required');
    }

    const res = await sanctum.put(`/api/v1/cases/notes/${noteId}`, {
      title: trimmedTitle,
      description: trimmedDescription,
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData) {
      return responseData as CaseNote;
    }
    throw new Error('Failed to update note: No data received');
  } catch (error: any) {
    console.error('Error updating note:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to update note');
      }
      throw new Error(errorData.message || 'Failed to update note');
    }
    throw new Error(error.message || 'Failed to update note');
  }
};

export const deleteNoteAuthenticated = async (noteId: string): Promise<void> => {
  try {
    await sanctum.delete(`/api/v1/cases/notes/${noteId}`);
  } catch (error: any) {
    console.error('Error deleting note:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.message || 'Failed to delete note');
    }
    throw new Error(error.message || 'Failed to delete note');
  }
};

// Authenticated chat actions (for backend dashboard)
export const getUnreadChatCountAuthenticated = async (caseId: string): Promise<number> => {
  try {
    const res = await sanctum.get(`/api/v1/cases/${caseId}/chats/unread-count`);
    const responseData: any = (res as any)?.data ?? null;
    if (responseData?.unread_count !== undefined) {
      return responseData.unread_count;
    }
    return 0;
  } catch (error: any) {
    console.error('Error fetching unread chat count:', error);
    return 0;
  }
};

export const markChatMessagesAsReadAuthenticated = async (caseId: string): Promise<void> => {
  try {
    await sanctum.put(`/api/v1/cases/${caseId}/chats/mark-read`);
  } catch (error: any) {
    console.error('Error marking chat messages as read:', error);
    // Don't throw - this is a non-critical operation
  }
};

export const getCaseChatsAuthenticated = async (caseId: string): Promise<CaseChatMessage[]> => {
  try {
    const res = await sanctum.get(`/api/v1/cases/${caseId}/chats`);
    const responseData: any = (res as any)?.data ?? null;

    // The sanctum interceptor already extracted the data
    if (Array.isArray(responseData)) {
      return responseData;
    }

    // Fallback: if responseData is not an array, it might still be wrapped
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      const unwrappedData = (responseData as any).data;
      if (Array.isArray(unwrappedData)) {
        return unwrappedData;
      }
    }

    throw new Error('Failed to fetch chat messages: Invalid response format');
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to fetch chat messages');
      }
      throw new Error(errorData.message || 'Failed to fetch chat messages');
    }
    throw new Error(error.message || 'Failed to fetch chat messages');
  }
};

export const sendChatMessageAuthenticated = async (
  caseId: string,
  message: string
): Promise<CaseChatMessage> => {
  try {
    // Client-side validation
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (message.trim().length > 10000) {
      throw new Error('Message must not exceed 10,000 characters');
    }

    const res = await sanctum.post('/api/v1/cases/chats', {
      case_id: caseId,
      message: message.trim(),
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData) {
      return responseData as CaseChatMessage;
    }
    throw new Error('Failed to send message: No data received');
  } catch (error: any) {
    console.error('Error sending message:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to send message');
      }
      throw new Error(errorData.message || 'Failed to send message');
    }
    throw new Error(error.message || 'Failed to send message');
  }
};

export const sendChatAudioAuthenticated = async (
  caseId: string,
  audioFile: Blob
): Promise<CaseChatMessage> => {
  try {
    // Client-side validation
    if (audioFile.size === 0) {
      throw new Error('Audio file is empty');
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      throw new Error('Audio file size must not exceed 10MB');
    }

    // Get the MIME type from the blob, default to webm if not set
    let mimeType = audioFile.type || 'audio/webm';

    // Normalize MIME type
    if (mimeType.includes(';')) {
      mimeType = mimeType.split(';')[0].trim();
    }

    // Map to supported types
    const supportedTypes: { [key: string]: string } = {
      'audio/webm': 'audio/webm',
      'audio/wav': 'audio/wav',
      'audio/x-wav': 'audio/wav',
      'audio/wave': 'audio/wav',
      'audio/mpeg': 'audio/mpeg',
      'audio/mp3': 'audio/mp3',
      'audio/x-mpeg': 'audio/mpeg',
      'audio/ogg': 'audio/ogg',
      'audio/opus': 'audio/ogg',
    };

    mimeType = supportedTypes[mimeType] || 'audio/webm';

    // Determine file extension
    let extension = 'webm';
    if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) extension = 'mp3';
    else if (mimeType.includes('ogg')) extension = 'ogg';
    else if (mimeType.includes('webm')) extension = 'webm';

    // Create a File object
    const file = new File([audioFile], `audio.${extension}`, { type: mimeType });

    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('audio', file, `audio.${extension}`);

    const res = await sanctum.post('/api/v1/cases/chats/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData) {
      return responseData as CaseChatMessage;
    }
    throw new Error('Failed to send audio message: No data received');
  } catch (error: any) {
    console.error('Error sending audio:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to send audio message');
      }
      throw new Error(errorData.message || 'Failed to send audio message');
    }
    throw new Error(error.message || 'Failed to send audio message');
  }
};

export const sendChatImageAuthenticated = async (
  caseId: string,
  imageFile: File
): Promise<CaseChatMessage> => {
  try {
    // Client-side validation
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('Image file size must not exceed 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid image type. Allowed types: JPEG, JPG, PNG, GIF, WEBP');
    }

    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('image', imageFile);

    const res = await sanctum.post('/api/v1/cases/chats/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData) {
      return responseData as CaseChatMessage;
    }
    throw new Error('Failed to send image: No data received');
  } catch (error: any) {
    console.error('Error sending image:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to send image');
      }
      throw new Error(errorData.message || 'Failed to send image');
    }
    throw new Error(error.message || 'Failed to send image');
  }
};

export const getUnreadLegalSupportCountAuthenticated = async (caseId: string): Promise<number> => {
  try {
    const res = await sanctum.get(`/api/v1/cases/${caseId}/legal-support/unread-count`);
    const responseData: any = (res as any)?.data ?? null;

    if (responseData?.data?.unread_count !== undefined) {
      return responseData.data.unread_count;
    }

    if (responseData?.unread_count !== undefined) {
      return responseData.unread_count;
    }

    return 0;
  } catch (error: any) {
    console.error('Error fetching legal support unread count:', error);
    return 0;
  }
};

export const markLegalSupportMessagesAsReadAuthenticated = async (
  caseId: string
): Promise<void> => {
  try {
    await sanctum.put(`/api/v1/cases/${caseId}/legal-support/mark-read`);
  } catch (error: any) {
    console.error('Error marking legal support messages as read:', error);
  }
};

export const getLegalSupportChatsAuthenticated = async (
  caseId: string
): Promise<LegalSupportMessage[]> => {
  try {
    const res = await sanctum.get(`/api/v1/cases/${caseId}/legal-support`);
    const responseData: any = (res as any)?.data ?? null;

    if (Array.isArray(responseData)) {
      return responseData as LegalSupportMessage[];
    }

    if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData.data)) {
        return responseData.data as LegalSupportMessage[];
      }

      if (Array.isArray(responseData?.data?.data)) {
        return responseData.data.data as LegalSupportMessage[];
      }
    }

    throw new Error('Failed to fetch legal support messages: Invalid response format');
  } catch (error: any) {
    console.error('Error fetching legal support messages:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to fetch legal support messages');
      }
      throw new Error(errorData.message || 'Failed to fetch legal support messages');
    }
    throw new Error(error.message || 'Failed to fetch legal support messages');
  }
};

export const sendLegalSupportMessageAuthenticated = async (
  caseId: string,
  message: string
): Promise<LegalSupportMessage> => {
  try {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (message.trim().length > 10000) {
      throw new Error('Message must not exceed 10,000 characters');
    }

    const res = await sanctum.post('/api/v1/cases/legal-support', {
      case_id: caseId,
      message: message.trim(),
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData?.data) {
      return responseData.data as LegalSupportMessage;
    }

    if (responseData) {
      return responseData as LegalSupportMessage;
    }

    throw new Error('Failed to send legal support message: No data received');
  } catch (error: any) {
    console.error('Error sending legal support message:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to send legal support message');
      }
      throw new Error(errorData.message || 'Failed to send legal support message');
    }
    throw new Error(error.message || 'Failed to send legal support message');
  }
};

export const sendLegalSupportAudioAuthenticated = async (
  caseId: string,
  audioFile: Blob
): Promise<LegalSupportMessage> => {
  try {
    if (audioFile.size === 0) {
      throw new Error('Audio file is empty');
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      throw new Error('Audio file size must not exceed 10MB');
    }

    let mimeType = audioFile.type || 'audio/webm';

    if (mimeType.includes(';')) {
      mimeType = mimeType.split(';')[0].trim();
    }

    const supportedTypes: { [key: string]: string } = {
      'audio/webm': 'audio/webm',
      'audio/wav': 'audio/wav',
      'audio/x-wav': 'audio/wav',
      'audio/wave': 'audio/wav',
      'audio/mpeg': 'audio/mpeg',
      'audio/mp3': 'audio/mp3',
      'audio/x-mpeg': 'audio/mpeg',
      'audio/ogg': 'audio/ogg',
      'audio/opus': 'audio/ogg',
    };

    mimeType = supportedTypes[mimeType] || 'audio/webm';

    let extension = 'webm';
    if (mimeType.includes('wav')) extension = 'wav';
    else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) extension = 'mp3';
    else if (mimeType.includes('ogg')) extension = 'ogg';

    const file = new File([audioFile], `audio.${extension}`, { type: mimeType });

    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('audio', file, `audio.${extension}`);

    const res = await sanctum.post('/api/v1/cases/legal-support/audio', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData?.data) {
      return responseData.data as LegalSupportMessage;
    }

    if (responseData) {
      return responseData as LegalSupportMessage;
    }

    throw new Error('Failed to send legal support audio message: No data received');
  } catch (error: any) {
    console.error('Error sending legal support audio message:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to send legal support audio message');
      }
      throw new Error(errorData.message || 'Failed to send legal support audio message');
    }
    throw new Error(error.message || 'Failed to send legal support audio message');
  }
};

export const sendLegalSupportImageAuthenticated = async (
  caseId: string,
  imageFile: File
): Promise<LegalSupportMessage> => {
  try {
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('Image file size must not exceed 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid image type. Allowed types: JPEG, JPG, PNG, GIF, WEBP');
    }

    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('image', imageFile);

    const res = await sanctum.post('/api/v1/cases/legal-support/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const responseData: any = (res as any)?.data ?? null;
    if (responseData?.data) {
      return responseData.data as LegalSupportMessage;
    }

    if (responseData) {
      return responseData as LegalSupportMessage;
    }

    throw new Error('Failed to send legal support image message: No data received');
  } catch (error: any) {
    console.error('Error sending legal support image message:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to send legal support image message');
      }
      throw new Error(errorData.message || 'Failed to send legal support image message');
    }
    throw new Error(error.message || 'Failed to send legal support image message');
  }
};

export const updateCaseReportSettings = async (
  caseId: string,
  data: UpdateReportSettingsData
): Promise<ReportSettingsResponse> => {
  try {
    // Client-side validation
    if (!data.status || !['new', 'open', 'in_progress', 'closed', 'pending', 'resolved', 'rejected', 'cancelled', 'spam', 'other'].includes(data.status)) {
      throw new Error('Status must be one of: new, open, in_progress, closed, pending, resolved, rejected, cancelled, spam, other');
    }

    const payload: any = {
      status: data.status,
    };

    if (data.case_manager_id !== undefined) {
      payload.case_manager_id = data.case_manager_id || null;
    }
    if (data.open_deadline_number !== undefined) {
      payload.open_deadline_number = data.open_deadline_number ?? null;
    }
    if (data.open_deadline_period !== undefined) {
      payload.open_deadline_period = data.open_deadline_period || null;
    }
    if (data.close_deadline_number !== undefined) {
      payload.close_deadline_number = data.close_deadline_number ?? null;
    }
    if (data.close_deadline_period !== undefined) {
      payload.close_deadline_period = data.close_deadline_period || null;
    }
    if (data.other_report_link !== undefined) {
      payload.other_report_link = data.other_report_link || null;
    }
    if (data.automatic_delete !== undefined) {
      payload.automatic_delete = data.automatic_delete;
    }
    if (data.case_category_id !== undefined) {
      payload.case_category_id = data.case_category_id || null;
    }
    if (data.reporting_medium !== undefined) {
      payload.reporting_medium = data.reporting_medium || null;
    }
    if (data.department_id !== undefined) {
      payload.department_id = data.department_id || null;
    }
    if (data.severity_id !== undefined) {
      payload.severity_id = data.severity_id || null;
    }
    if (data.state_id !== undefined) {
      payload.state_id = data.state_id || null;
    }

    // Use sanctum for authenticated requests (handles CSRF tokens)
    // Note: sanctum interceptor already extracts the data from {status, message, data} envelope
    const res = await sanctum.put(`/api/v1/cases/${caseId}/report-settings`, payload);
    const responseData: any = (res as any)?.data ?? null;

    // The sanctum interceptor already extracted the inner data, so responseData is the actual data
    // If we got here without an error, the request was successful
    if (responseData) {
      return responseData as ReportSettingsResponse;
    }
    throw new Error('Failed to update report settings: No data received');
  } catch (error: any) {
    console.error('Error updating report settings:', error);
    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.data?.errors) {
        const errorMessages = Object.values(errorData.data.errors).flat();
        throw new Error(errorMessages.join(', ') || 'Failed to update report settings');
      }
      throw new Error(errorData.message || 'Failed to update report settings');
    }
    throw new Error(error.message || 'Failed to update report settings');
  }
};

export const createCaseLog = async (
  caseId: string,
  actionType: string,
  actionValue?: string
): Promise<CaseLogEntry> => {
  try {
    // Client-side validation
    if (!actionType.trim()) {
      throw new Error('Action type cannot be empty');
    }

    if (actionType.trim().length > 255) {
      throw new Error('Action type must not exceed 255 characters');
    }

    if (actionValue && actionValue.length > 10000) {
      throw new Error('Action value must not exceed 10,000 characters');
    }

    const res = await axios.post('/api/v1/public/cases/logs', {
      case_id: caseId,
      action_type: actionType.trim(),
      action_value: actionValue?.trim() || null,
    });

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to create case log');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to create case log');
  }
};

export const sendChatImage = async (caseId: string, imageFile: File): Promise<CaseChatMessage> => {
  try {
    // Client-side validation
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('Image file size must not exceed 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid image type. Allowed types: JPEG, JPG, PNG, GIF, WEBP');
    }

    const formData = new FormData();
    formData.append('case_id', caseId);
    formData.append('image', imageFile);

    const res = await axios.post('/api/v1/public/cases/chats/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data: any = (res as any)?.data ?? null;
    if (data?.status && data?.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Failed to send image message');
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Failed to send image message');
  }
};
