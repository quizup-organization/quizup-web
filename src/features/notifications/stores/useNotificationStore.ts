import { create } from "zustand";
import type { NotificationView } from "@/shared/types/notifications";

interface NotificationUiState {
  /** Invitations de défi reçues en direct et non encore acceptées/refusées. */
  invitations: NotificationView[];
  /**
   * Invitation ré-affichée depuis l'inbox (clic sur une notification de défi) : prend le pas
   * sur la file live tant qu'elle n'est pas tranchée.
   */
  selectedInvitation: NotificationView | null;
  /**
   * Dernière invitation retirée de la file : conservée pour laisser la modale live jouer son
   * animation de fermeture (sinon elle est démontée avant la fin de l'animation).
   */
  lastInvitation: NotificationView | null;
  pushInvitation: (notification: NotificationView) => void;
  selectInvitation: (notification: NotificationView | null) => void;
  removeInvitation: (notificationId: string) => void;
  clearInvitations: () => void;
}

/**
 * État UI de l'inbox : file d'invitations live + invitation sélectionnée depuis l'inbox
 * (le panneau et la modale s'y abonnent). Les notifications persistées vivent dans React Query
 * (read model serveur).
 */
export const useNotificationStore = create<NotificationUiState>()((set) => ({
  invitations: [],
  selectedInvitation: null,
  lastInvitation: null,
  pushInvitation: (notification) =>
    set((state) =>
      state.invitations.some((i) => i.notificationId === notification.notificationId)
        ? state
        : { invitations: [...state.invitations, notification] },
    ),
  selectInvitation: (notification) => set({ selectedInvitation: notification }),
  removeInvitation: (notificationId) =>
    set((state) => {
      const selected = state.selectedInvitation;
      const removed =
        state.invitations.find((i) => i.notificationId === notificationId) ??
        (selected?.notificationId === notificationId ? selected : null);
      return {
        invitations: state.invitations.filter(
          (i) => i.notificationId !== notificationId,
        ),
        selectedInvitation:
          selected?.notificationId === notificationId ? null : selected,
        lastInvitation: removed ?? state.lastInvitation,
      };
    }),
  clearInvitations: () =>
    set((state) => ({
      invitations: [],
      selectedInvitation: null,
      lastInvitation:
        state.selectedInvitation ??
        state.invitations[0] ??
        state.lastInvitation,
    })),
}));
