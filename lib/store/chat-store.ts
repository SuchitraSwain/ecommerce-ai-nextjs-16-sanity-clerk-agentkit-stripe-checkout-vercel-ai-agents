import { createStore } from "zustand/vanilla";

// Types
export interface ChatState {
  isOpen: boolean;
}

export interface ChatActions {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

export type ChatStore = ChatState & ChatActions;

// Default state
export const defaultInitState: ChatState = {
  isOpen: false,
};

/**
 * Chat store factory - creates new store instance per provider
 * Simple store for managing chat sheet visibility
 * No persistence needed - chat should start closed on page load
 */
export const createChatStore = (initState: ChatState = defaultInitState) => {
  return createStore<ChatStore>()((set) => ({
    ...initState,

    openChat: () => set({ isOpen: true }),
    closeChat: () => set({ isOpen: false }),
    toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  }));
};
