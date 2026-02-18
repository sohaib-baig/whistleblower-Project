import type { ReactNode } from 'react';

import { useContext, createContext } from 'react';

// ----------------------------------------------------------------------

interface ChatContextType {
  resetChatCount: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ----------------------------------------------------------------------

interface ChatProviderProps {
  children: ReactNode;
  resetChatCount: () => void;
}

export function ChatProvider({ children, resetChatCount }: ChatProviderProps) {
  return <ChatContext.Provider value={{ resetChatCount }}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
