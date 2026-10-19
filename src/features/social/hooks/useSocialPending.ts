import { useMemo } from "react"
import { getSessionUserId } from "@/features/auth"
import { useMyChallenges } from "@/features/challenges"
import { useMyOpenRooms } from "@/features/rooms"
import {
  splitPendingChallenges,
  toReceivedDuel,
  toRoomDuel,
  toSentDuel,
  type PendingDuel,
  type ReceivedDuel,
} from "../domain/pending-duel"

export interface SocialPending {
  /** Invitations reçues, en cartes empilées comme les défis envoyés. */
  received: ReceivedDuel[]
  /** Défis envoyés en attente (annulables). */
  sent: PendingDuel[]
  /** Salons ouverts (à ouvrir / annuler). */
  rooms: PendingDuel[]
  /** Total en attente — pastille de navigation (reçus + envoyés + salons). */
  total: number
  isLoading: boolean
}

/**
 * Tout ce qui attend une action du joueur (défis reçus/envoyés, salons ouverts), partagé par
 * la page Défis & Salons et la pastille de navigation « Défis ». Les deux listes sont déjà
 * rafraîchies en direct (STOMP) et par polling : aucune requête supplémentaire n'est émise.
 */
export function useSocialPending(): SocialPending {
  const me = getSessionUserId()
  const challenges = useMyChallenges()
  const openRooms = useMyOpenRooms()

  return useMemo(() => {
    const { received, sent } = splitPendingChallenges(challenges.data ?? [], me)
    const rooms = openRooms.data ?? []
    return {
      received: received.map(toReceivedDuel),
      sent: sent.map(toSentDuel),
      rooms: rooms.map(toRoomDuel),
      total: received.length + sent.length + rooms.length,
      isLoading: challenges.isLoading || openRooms.isLoading,
    }
  }, [
    challenges.data,
    challenges.isLoading,
    openRooms.data,
    openRooms.isLoading,
    me,
  ])
}
