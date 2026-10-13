import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { reconcileGameViews } from "@/features/challenges"
import { queryKeys } from "@/lib/query-keys"
import { playNotificationChime } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import type {
  NotificationType,
  NotificationView,
} from "@/shared/types/notifications"
import { isExpired } from "../domain/notification"
import { useNotificationStore } from "../stores/useNotificationStore"

/** Payload du push relayé par le Service Worker (`QUIZUP_PUSH`) — sous-ensemble de `WebPushMessage`. */
interface PushPayload {
  notificationId?: string
  type?: NotificationType
  actorId?: string | null
  sourceId?: string | null
  topicId?: string | null
  gameId?: string | null
  expiresAt?: string | null
}

/**
 * Rejoue les invalidations React Query à la réception d'un push : le Service Worker relaie le
 * payload à **tous les onglets ouverts** (même en arrière-plan, quand le STOMP est en veille).
 * Inbox + badge systématiquement, vues de duel pour les types défi/salon, bannière de reprise
 * pour un défi accepté ; une invitation est aussi ré-affichée en modale live.
 */
export function usePushMessages(): void {
  const queryClient = useQueryClient()
  const pushInvitation = useNotificationStore((s) => s.pushInvitation)
  const soundEnabled = useSoundStore((s) => s.enabled)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const onMessage = (event: MessageEvent) => {
      const message = event.data as {
        type?: string
        payload?: PushPayload
      } | null
      if (!message || message.type !== "QUIZUP_PUSH") return
      const payload = message.payload ?? {}

      if (soundEnabled && document.visibilityState === "hidden") {
        playNotificationChime(payload.type)
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
      const type = payload.type
      if (type?.startsWith("CHALLENGE_") || type?.startsWith("ROOM_")) {
        reconcileGameViews(queryClient)
      }
      if (type === "ROOM_ACCEPTED") {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.games.active(),
        })
      }

      if (
        type === "CHALLENGE_RECEIVED" &&
        payload.notificationId &&
        payload.sourceId
      ) {
        const invitation: NotificationView = {
          notificationId: payload.notificationId,
          type,
          actorId: payload.actorId ?? null,
          sourceId: payload.sourceId,
          topicId: payload.topicId ?? null,
          gameId: payload.gameId ?? null,
          expiresAt: payload.expiresAt ?? null,
          readAt: null,
          createdAt: new Date().toISOString(),
        }
        if (!isExpired(invitation)) pushInvitation(invitation)
      }
    }

    navigator.serviceWorker.addEventListener("message", onMessage)
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [pushInvitation, queryClient, soundEnabled])
}
