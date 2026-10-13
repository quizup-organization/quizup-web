import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "@/lib/query-keys"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { useImmersiveNavigate } from "@/features/shell"
import type { RoomView } from "../domain/room"
import { challengesService } from "../lib/challenges"
import {
  removeMatchingFromList,
  scheduleInvalidate,
} from "@/shared/utils/optimistic-reconcile"
import { roomsService } from "../lib/rooms"

/** Paramètres de création : `opponentId` renseigné = défi nominatif. */
export interface CreateRoomParams {
  topicId: string
  opponentId?: string
}

/**
 * Crée un **défi nominatif** (intention asynchrone : toast + suivi par la bannière d'accueil)
 * ou une **salle partagée** (salle directe `/rooms/{id}`).
 */
export function useCreateRoom() {
  const { t } = useTranslation()
  const navigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ topicId, opponentId }: CreateRoomParams) => {
      if (opponentId) {
        const created = await challengesService.create({ topicId, opponentId })
        return { kind: "challenge" as const, id: created.id }
      }
      const created = await roomsService.create(topicId)
      return { kind: "room" as const, id: created.id }
    },
    onSuccess: (created) => {
      if (created.kind === "room") {
        // La nouvelle salle doit apparaître dans la section « Tes défis en attente » de
        // l'accueil sans attendre le staleTime global (5 min) ni un rechargement.
        void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
        navigate(`/rooms/${created.id}`)
        return
      }
      // Défi asynchrone : on reste sur la page, la section d'accueil suit l'état.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.mine(),
      })
      toast.success(t("game.toasts.challengeSent"))
    },
  })
}

/**
 * Annule une salle (initiateur) : retrait **optimiste** de la liste « Tes salons en attente »,
 * restauration en cas d'échec et réconciliation différée avec la projection Axon (elle peut
 * encore exposer la salle ~2 s — sans délai, la carte réapparaît et l'annulation semble
 * nécessiter deux clics).
 */
export function useCancelRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roomId: string) => roomsService.cancel(roomId),
    onMutate: async (roomId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rooms.mine() })
      const previous = queryClient.getQueryData<RoomView[]>(
        queryKeys.rooms.mine()
      )
      removeMatchingFromList<RoomView>(
        queryClient,
        queryKeys.rooms.mine(),
        (room) => room.roomId === roomId
      )
      return { previous }
    },
    onError: (_error, _roomId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.rooms.mine(), context.previous)
      }
    },
    onSettled: () => scheduleInvalidate(queryClient, [queryKeys.rooms.mine()]),
  })
}

/**
 * Quitte / annule la salle : retour natif (pas de redirection artificielle). L'annulation
 * retire immédiatement la salle de la liste d'accueil (« Défi en attente ») ; une simple
 * sortie (« Retour ») la laisse ouverte, la carte reste.
 */
export function useLeaveRoom(roomId: string, cancel = false) {
  const goBack = useGoBack()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      cancel ? roomsService.cancel(roomId) : roomsService.leave(roomId),
    onMutate: async () => {
      if (!cancel) return undefined
      await queryClient.cancelQueries({ queryKey: queryKeys.rooms.mine() })
      const previous = queryClient.getQueryData<RoomView[]>(
        queryKeys.rooms.mine()
      )
      removeMatchingFromList<RoomView>(
        queryClient,
        queryKeys.rooms.mine(),
        (room) => room.roomId === roomId
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (cancel && context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.rooms.mine(), context.previous)
      }
    },
    onSuccess: () => {
      if (cancel) {
        scheduleInvalidate(queryClient, [queryKeys.rooms.mine()])
      }
      goBack()
    },
  })
}

/**
 * **Apparition** dans la salle au montage : la commande unique porte la présence et, pour le
 * second humain, l'enregistrement comme participant. Le client seul la déclenche — aucune saga
 * ne le fait à sa place. **Aucun `leave` au démontage** : quitter l'écran ne ferme pas la salle
 * (compatible React StrictMode). Court retry tant que la salle n'est pas encore créée par la
 * saga (acceptation de défi : la projection expose le roomId avant la création effective).
 */
export function useRoomJoin(roomId: string): void {
  const joined = useRef(false)
  useEffect(() => {
    if (!roomId || joined.current) return
    joined.current = true
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const join = (attempt: number): void => {
      void roomsService.join(roomId).catch(() => {
        if (!cancelled && attempt < 10) {
          timer = setTimeout(() => join(attempt + 1), 400)
        }
      })
    }
    join(0)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [roomId])
}
