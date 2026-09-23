import { create } from "zustand";
import type { User } from "oidc-client-ts";

/**
 * Source unique et réactive de la session OIDC (même pattern que le thème : store Zustand
 * + provider d'effets). Le stockage des tokens reste porté par `oidc-client-ts`
 * (`WebStorageStateStore`) : ce store n'est **pas** persisté, il expose le snapshot courant
 * et le rend lisible aussi bien dans React (sélecteurs) qu'en dehors (`getState()`).
 */
export type SessionStatus = "loading" | "anonymous" | "authenticated";

interface SessionState {
  status: SessionStatus;
  user: User | null;
  setUser: (user: User | null) => void;
  setStatus: (status: SessionStatus) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  user: null,
  setUser: (user) => set({ user, status: user ? "authenticated" : "anonymous" }),
  setStatus: (status) => set({ status }),
}));

export const selectStatus = (state: SessionState): SessionStatus => state.status;
export const selectUser = (state: SessionState): User | null => state.user;

export const selectUserId = (state: SessionState): string | null => {
  const profile = state.user?.profile as
    | { user_id?: string; sub?: string }
    | undefined;
  return profile?.user_id ?? profile?.sub ?? null;
};

export const selectDisplayName = (state: SessionState): string | null => {
  const profile = state.user?.profile as
    | { email?: string; preferred_username?: string }
    | undefined;
  return profile?.preferred_username ?? profile?.email ?? null;
};

export const selectAuthenticated = (state: SessionState): boolean =>
  state.user !== null;

/**
 * Accesseurs non réactifs pour les couches data (clés React Query, services) : l'identité
 * est stable pendant toute la session (un changement d'utilisateur déclenche un rechargement).
 * L'UI qui doit réagir à l'auth utilise les sélecteurs (`useSessionStore(selectX)`).
 */
export function getSessionUser(): User | null {
  return useSessionStore.getState().user;
}

export function getSessionUserId(): string | null {
  return selectUserId(useSessionStore.getState());
}

export function getSessionDisplayName(): string | null {
  return selectDisplayName(useSessionStore.getState());
}

export function getAccessToken(): string | null {
  return useSessionStore.getState().user?.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return useSessionStore.getState().user?.refresh_token ?? null;
}
