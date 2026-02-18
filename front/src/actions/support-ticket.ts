import type { CaseListItem } from 'src/actions/company-case-details';
import type {
  ISupportTicket,
  ISupportTicketChat,
  ISupportTicketForm,
  ISupportTicketItem,
  ISupportTicketChatForm,
} from 'src/types/support-ticket';

import { sanctum } from 'src/lib/axios-sanctum';
import { getCasesList } from 'src/actions/company-case-details';

export interface ISupportTicketsResponse {
  data: ISupportTicketItem[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ISupportTicketChatsResponse {
  data: ISupportTicketChat[];
}

/**
 * Fetch support tickets list
 */
export async function fetchSupportTickets(params?: {
  status?: string;
  search?: string;
  per_page?: number;
}): Promise<ISupportTicketsResponse> {
  try {
    const res = await sanctum.get('/api/v1/support-tickets', { params });
    return res.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch support tickets');
  }
}

/**
 * Fetch a single support ticket with chats
 */
export async function fetchSupportTicket(ticketId: string): Promise<ISupportTicket> {
  try {
    const res = await sanctum.get(`/api/v1/support-tickets/${ticketId}`);

    // Check if the response has the expected structure
    const payload = res?.data;

    // Preferred shape: { status: true, data: {...ticket} }
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as ISupportTicket;
    }

    // Fallback: payload itself is the ticket
    if (payload && typeof payload === 'object' && 'id' in payload) {
      return payload as ISupportTicket;
    }

    throw new Error('Invalid response structure: ' + JSON.stringify(payload));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch support ticket');
  }
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(data: ISupportTicketForm): Promise<ISupportTicket> {
  try {
    const res = await sanctum.post('/api/v1/support-tickets', data);
    return res.data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create support ticket');
  }
}

/**
 * Update support ticket status
 */
export async function updateSupportTicketStatus(
  ticketId: string,
  status: 'open' | 'closed'
): Promise<ISupportTicket> {
  try {
    const res = await sanctum.put(`/api/v1/support-tickets/${ticketId}/status`, { status });
    return res.data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update support ticket status');
  }
}

/**
 * Fetch chats for a support ticket
 */
export async function fetchSupportTicketChats(ticketId: string): Promise<ISupportTicketChatsResponse> {
  try {
    const res = await sanctum.get(`/api/v1/support-tickets/${ticketId}/chats`);

    const payload = res?.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload as ISupportTicketChatsResponse;
    }

    // Fallback: wrap array in expected shape
    if (Array.isArray(payload)) {
      return { data: payload as ISupportTicketChat[] };
    }

    return { data: [] };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch support ticket chats');
  }
}

/**
 * Create a new chat message for a support ticket
 */
export async function createSupportTicketChat(data: ISupportTicketChatForm): Promise<ISupportTicketChat> {
  try {
    const formData = new FormData();
    formData.append('support_ticket_id', data.support_ticket_id);
    formData.append('content', data.content);

    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }

    const res = await sanctum.post('/api/v1/support-tickets/chats', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const payload = res?.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data as ISupportTicketChat;
    }
    if (payload && typeof payload === 'object' && 'id' in payload) {
      return payload as ISupportTicketChat;
    }
    throw new Error('Invalid response structure');
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send message');
  }
}

/**
 * Get unread chat count for a support ticket
 */
export async function getSupportTicketUnreadCount(ticketId: string): Promise<{ unread_count: number }> {
  try {
    const res = await sanctum.get(`/api/v1/support-tickets/${ticketId}/chats/unread-count`);
    return res.data.data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get unread count');
  }
}

/**
 * Mark chats as read for a support ticket
 */
export async function markSupportTicketChatsAsRead(ticketId: string): Promise<void> {
  try {
    await sanctum.put(`/api/v1/support-tickets/${ticketId}/chats/mark-read`);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to mark chats as read');
  }
}

/**
 * Fetch active cases for a company (or all, then filter client-side)
 * Active cases are those that are not closed; optionally filter by companyId
 */
export async function fetchActiveCases(companyId?: string): Promise<CaseListItem[]> {
  try {
    const allCases = await getCasesList();
    // Filter out closed cases and optionally restrict to a specific company
    return allCases.filter(
      (caseItem) =>
        caseItem.status !== 'closed' && (!companyId || caseItem.company?.id === companyId)
    );
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch active cases');
  }
}