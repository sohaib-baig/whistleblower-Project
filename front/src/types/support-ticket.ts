import type { IDateValue, IDatePickerControl } from './common';

// ----------------------------------------------------------------------

export type ISupportTicketTableFilters = {
  name: string;
  status: string;
  startDate: IDatePickerControl;
  endDate: IDatePickerControl;
};

export type ISupportTicketItem = {
  id: string;
  title: string;
  status: 'open' | 'closed';
  created_by: string;
  support_type?: 'legal_support' | 'technical_support';
  case_id?: string | null;
  creator: {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  };
  unread_count: number;
  latest_chat?: {
    id: string;
    content: string;
    created_at: string;
    sender: {
      id: string;
      name: string;
    };
  };
  created_at: IDateValue;
  updated_at: IDateValue;
};

export type ISupportTicket = {
  id: string;
  title: string;
  status: 'open' | 'closed';
  created_by: string;
  support_type?: 'legal_support' | 'technical_support';
  case_id?: string | null;
  creator: {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  };
  chats: ISupportTicketChat[];
  created_at: IDateValue;
  updated_at: IDateValue;
};

export type ISupportTicketChat = {
  id: string;
  support_ticket_id: string;
  content: string;
  reply_from: string;
  reply_to?: string;
  attachment?: string;
  created_from: 'admin' | 'case_manager' | 'company';
  sender: {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  };
  receiver?: {
    id: string;
    name: string;
    company_name?: string;
    email: string;
  };
  created_at: IDateValue;
  updated_at: IDateValue;
};

export type ISupportTicketForm = {
  title: string;
  content: string;
  status?: 'open' | 'closed';
  support_type: 'legal_support' | 'technical_support';
  case_id?: string | null;
};

export type ISupportTicketChatForm = {
  support_ticket_id: string;
  content: string;
  attachment?: File;
};