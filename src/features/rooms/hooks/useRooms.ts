import { useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { useImmersiveNavigate } from "@/features/shell"
import type { RoomView } from "../domain/room"
import {
  reconcileUntil,
  removeMatchingFromList,
} from "@/shared/utils/optimistic-reconcile"
import { roomsService } from "../lib/rooms"

/** Invalide la liste après convergence (ou en secours au timeout). */
function invalidateRooms(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
}

/**
 * Convergence de l'annulation : la projection peut encore exposer la salle ~2 s — on n'invalide
 * qu'une fois qu'elle a réellement disparu (sinon la carte réapparaît et l'annulation semble
 * nécessiter deux clics). Aucune lecture périmée n'est écrite dans le cache.
 */
function reconcileRooms(
  queryClient: ReturnType<typeof useQueryClient>,
  roomId: string
): void {
  void reconcileUntil<RoomView[]>({
    read: () => roomsService.mine(),
    matches: (rooms) => !rooms.some((room) => room.roomId === roomId),
    onConverged: () => invalidateRooms(queryClient),
    onTimeout: () => invalidateRooms(queryClient),
  })
}

/** Crée une **salle partagée** (lien `/join/{id}`) et ouvre directement la salle. */
export function useCreateSharedRoom() {
  const navigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicId: string) => roomsService.create(topicId),
    onSuccess: (created) => {
      // La nouvelle salle doit apparaître dans la section « Tes salons en attente » de
      // l'accueil sans attendre le staleTime global (5 min) ni un rechargement.
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
      navigate(`/rooms/${created.id}`)
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
    onSettled: (_data, error, roomId) => {
      if (error) return
      reconcileRooms(queryClient, roomId)
    },
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
      if (cancel) reconcileRooms(queryClient, roomId)
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
