const safeUuid = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export type HelpDeskChatMessage = {
  id: string;
  message: string;
  type: 'text' | 'audio' | 'image';
  created_by?: string;
  timestamp?: string;
  creator?: { name?: string };
  sender?: string;
};

// Placeholder implementations to satisfy TypeScript/build. Replace with real API calls when available.

export async function getHelpDeskChats(_requestId: string): Promise<HelpDeskChatMessage[]> {
  return [];
}

export async function getHelpDeskChatUnreadCount(
  _requestId: string
): Promise<{ unread: number }> {
  return { unread: 0 };
}

export async function markHelpDeskChatsAsRead(_requestId: string): Promise<void> {
  return;
}

export async function sendHelpDeskMessage(
  _requestId: string,
  message: string
): Promise<HelpDeskChatMessage> {
  return {
    id: safeUuid(),
    message,
    type: 'text',
    timestamp: new Date().toISOString(),
  };
}

export async function sendHelpDeskAudio(
  _requestId: string,
  file: File
): Promise<HelpDeskChatMessage> {
  return {
    id: safeUuid(),
    message: file.name,
    type: 'audio',
    timestamp: new Date().toISOString(),
  };
}

export async function sendHelpDeskImage(
  _requestId: string,
  file: File
): Promise<HelpDeskChatMessage> {
  return {
    id: safeUuid(),
    message: file.name,
    type: 'image',
    timestamp: new Date().toISOString(),
  };
}
