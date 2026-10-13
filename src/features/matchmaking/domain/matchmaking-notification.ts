/**
 * Contrat temps réel de l'**appariement public** (enveloppé par `EventEnvelopeResponse` en
 * REST d'historique comme en WebSocket) — miroir du `MatchmakingNotification` BFF.
 */

export type MatchmakingNotificationType =
  "SEARCHING" | "MATCHED" | "CANCELLED" | "FAILED"

export interface MatchmakingSearchingNotification {
  type: "SEARCHING"
  ticketId: string
  topicId: string
  /** Fin de recherche (repli bot) — bornes du compte à rebours client. */
  deadlineAt: string
}

export interface MatchmakingMatchedNotification {
  type: "MATCHED"
  ticketId: string
  /** Salle d'appariement créée : les deux joueurs (ou le joueur et le bot) y apparaissent. */
  roomId: string
  opponentId: string | null
  vsBot: boolean
}

export interface MatchmakingCancelledNotification {
  type: "CANCELLED"
  ticketId: string
}

export interface MatchmakingFailedNotification {
  type: "FAILED"
  ticketId: string
  reason: string
}

export type MatchmakingNotification =
  | MatchmakingSearchingNotification
  | MatchmakingMatchedNotification
  | MatchmakingCancelledNotification
  | MatchmakingFailedNotification
