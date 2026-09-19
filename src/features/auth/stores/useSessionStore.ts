import { create } from "zustand";

interface SessionState {
  ready: boolean;
  authenticated: boolean;
  setSession: (authenticated: boolean) => void;
  setReady: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  ready: false,
  authenticated: false,
  setSession: (authenticated) => set({ authenticated }),
  setReady: () => set({ ready: true }),
}));
