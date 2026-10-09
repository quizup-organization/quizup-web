import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  challengesService,
  lobbiesService,
  useDeclineLobby,
} from "@/features/duel";
import { queryKeys } from "@/lib/query-keys";
import type { NotificationView } from "@/shared/types/notifications";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useMarkNotificationRead } from "./useNotifications";

/** Attend la salle créée à l'acceptation (la saga la crée juste après la commande). */
async function waitForRoom(challengeId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const challenge = await challengesService
      .get(challengeId)
      .catch(() => null);
    if (challenge?.roomId) return challenge.roomId;
    if (
      challenge &&
      challenge.status !== "PENDING" &&
      challenge.status !== "ACCEPTED"
    ) {
      return null;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return null;
}

/**
 * Accepter un défi = accepter le **défi nominatif** (la salle est créée par la saga → on y va
 * directement) ou rejoindre un ancien salon nominatif (`LOBBY_INVITATION`).
 * Refuser = commande réservée à l'invité. Dans les deux cas la notification est lue.
 *
 * Un défi/salon peut avoir expiré/purgé depuis la réception : l'échec est absorbé (pas de
 * `Uncaught (in promise)`), la notification est nettoyée et l'inbox rafraîchie.
 */
export function useLobbyInvitationActions() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const removeInvitation = useNotificationStore((s) => s.removeInvitation);
  const decline = useDeclineLobby();
  const markRead = useMarkNotificationRead();
  const join = useMutation({
    mutationFn: (lobbyId: string) => lobbiesService.join(lobbyId),
  });
  const acceptChallenge = useMutation({
    mutationFn: (challengeId: string) => challengesService.accept(challengeId),
  });
  const declineChallenge = useMutation({
    mutationFn: (challengeId: string) => challengesService.decline(challengeId),
  });

  /** Les sections d'accueil « défis/salons en attente » changent dès qu'un défi est tranché. */
  const reconcileDuelViews = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.lobbies.mine() });
  };

  const cleanUpObsolete = (notification: NotificationView) => {
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    reconcileDuelViews();
  };

  const accept = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId;
    if (!sourceId) return;
    const isChallenge = notification.type === "CHALLENGE_RECEIVED";
    try {
      if (isChallenge) {
        await acceptChallenge.mutateAsync(sourceId);
      } else {
        await join.mutateAsync(sourceId);
      }
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    reconcileDuelViews();
    if (!isChallenge) {
      navigate(`/lobbies/${sourceId}`);
      return;
    }
    const roomId = await waitForRoom(sourceId);
    navigate(roomId ? `/lobbies/${roomId}` : "/notifications");
  };

  const refuse = async (notification: NotificationView): Promise<void> => {
    const sourceId = notification.sourceId;
    if (!sourceId) return;
    const isChallenge = notification.type === "CHALLENGE_RECEIVED";
    try {
      if (isChallenge) {
        await declineChallenge.mutateAsync(sourceId);
      } else {
        await decline.mutateAsync(sourceId);
      }
    } catch {
      cleanUpObsolete(notification);
      return;
    }
    removeInvitation(notification.notificationId);
    markRead.mutate(notification.notificationId);
    reconcileDuelViews();
  };

  return {
    accept,
    refuse,
    pending:
      join.isPending ||
      decline.isPending ||
      acceptChallenge.isPending ||
      declineChallenge.isPending,
  };
}
