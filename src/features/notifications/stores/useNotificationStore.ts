import { create } from "zustand";
import type { NotificationView } from "@/shared/types/notifications";

interface NotificationUiState {
  /** Invitations de défi reçues en direct et non encore acceptées/refusées. */
  invitations: NotificationView[];
  /**
   * Dernière invitation retirée de la file : conservée pour laisser la modale live jouer son
   * animation de fermeture (sinon elle est démontée avant la fin de l'animation).
   */
  lastInvitation: NotificationView | null;
  pushInvitation: (notification: NotificationView) => void;
  removeInvitation: (notificationId: string) => void;
  clearInvitations: () => void;
}

/**
 * État UI de l'inbox : file d'invitations live (le panneau et la modale s'y abonnent).
 * Les notifications persistées vivent dans React Query (read model serveur).
 */
export const useNotificationStore = create<NotificationUiState>()((set) => ({
  invitations: [],
  lastInvitation: null,
  pushInvitation: (notification) =>
    set((state) =>
      state.invitations.some((i) => i.notificationId === notification.notificationId)
        ? state
        : { invitations: [...state.invitations, notification] },
    ),
  removeInvitation: (notificationId) =>
    set((state) => ({
      invitations: state.invitations.filter(
        (i) => i.notificationId !== notificationId,
      ),
      lastInvitation:
        state.invitations.find((i) => i.notificationId === notificationId) ??
        state.lastInvitation,
    })),
  clearInvitations: () =>
    set((state) => ({
      invitations: [],
      lastInvitation: state.invitations[0] ?? state.lastInvitation,
    })),
}));
