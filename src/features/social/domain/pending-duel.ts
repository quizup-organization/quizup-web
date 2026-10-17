import type { ChallengeView } from "@/features/challenges/domain/challenge"
import type { RoomView } from "@/features/rooms/domain/room"

/**
 * Élément en attente d'action affiché dans l'espace Social : défi reçu (invité), défi envoyé
 * (lanceur) ou salon ouvert. Contrat pur — aucune dépendance à une couche d'implémentation.
 */
export type PendingDuel =
  | {
      kind: "received"
      id: string
      topic: ChallengeView["topic"]
      player: ChallengeView["challenger"]
      expiresAt: string
      /** Défi de revanche : la partie d'origine est référencée (`gameId`). */
      rematch: boolean
    }
  | {
      kind: "sent"
      id: string
      topic: ChallengeView["topic"]
      player: ChallengeView["opponent"]
      expiresAt: string
      rematch: boolean
    }
  | {
      kind: "room"
      id: string
      topic: RoomView["topic"]
      player: RoomView["opponent"]
      /** Expiration de la salle (1 jour) — comme les défis, la carte affiche le compte à rebours. */
      expiresAt: string
      /** Seul l'initiateur peut annuler la salle. */
      canCancel: boolean
    }

/** Défi reçu (invité) — carte à accepter ou refuser. */
export type ReceivedDuel = Extract<PendingDuel, { kind: "received" }>

/** Défis `PENDING` d'un joueur, scindés en invitations reçues et défis envoyés. */
export function splitPendingChallenges(
  challenges: ChallengeView[],
  me: string | null
): { received: ChallengeView[]; sent: ChallengeView[] } {
  const pending = challenges.filter(
    (challenge) => challenge.status === "PENDING"
  )
  return {
    received: pending.filter((challenge) => challenge.opponent?.userId === me),
    sent: pending.filter((challenge) => challenge.challenger?.userId === me),
  }
}

export function toReceivedDuel(challenge: ChallengeView): ReceivedDuel {
  return {
    kind: "received",
    id: challenge.challengeId,
    topic: challenge.topic,
    player: challenge.challenger,
    expiresAt: challenge.expiresAt,
    rematch: challenge.gameId !== null,
  }
}

export function toSentDuel(challenge: ChallengeView): PendingDuel {
  return {
    kind: "sent",
    id: challenge.challengeId,
    topic: challenge.topic,
    player: challenge.opponent,
    expiresAt: challenge.expiresAt,
    rematch: challenge.gameId !== null,
  }
}

export function toRoomDuel(room: RoomView): PendingDuel {
  return {
    kind: "room",
    id: room.roomId,
    topic: room.topic,
    player: room.opponent,
    expiresAt: room.expiresAt,
    canCancel: room.canCancel,
  }
}
