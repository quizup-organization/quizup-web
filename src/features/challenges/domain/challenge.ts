import type { TopicRef } from "@/features/topics/domain/topic";
import type { UserRef } from "@/features/player/domain/profile";

/**
 * Modèle métier « défi » (contrat partagé entre features) + libellés purs (aucun React, aucun
 * fetch). Les actions disponibles (`ACCEPT`/`DECLINE`/`CANCEL`/`PLAY`) sont calculées par le BFF.
 */
export type ChallengeStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"
  | "COMPLETED";

/** Sens du défi relativement au joueur courant (enum backend `ChallengeDirection`). */
export type ChallengeDirection = "RECEIVED" | "SENT";

/** Action disponible sur un défi (enum backend `ChallengeAction`). */
export type ChallengeAction = "ACCEPT" | "DECLINE" | "CANCEL" | "PLAY";

/** Boîte de lecture de la liste (enum backend `ChallengeBox`). */
export type ChallengeBox = "RECEIVED" | "SENT" | "ALL";

/** Carte de défi (`ChallengeCardView`). */
export interface ChallengeCard {
  challengeId: string;
  direction: ChallengeDirection;
  status: ChallengeStatus;
  topic: TopicRef;
  opponent: UserRef;
  createdAt: string;
  expiresAt: string;
  gameId: string | null;
  winnerId: string | null;
  actions: ChallengeAction[];
}

/** Détail d'un défi (`ChallengeDetailView`). */
export interface ChallengeDetail {
  challengeId: string;
  direction: ChallengeDirection;
  status: ChallengeStatus;
  topic: TopicRef;
  challenger: UserRef;
  challenged: UserRef;
  createdAt: string;
  expiresAt: string;
  gameId: string | null;
  replayGameId: string | null;
  myRunGameId: string | null;
  opponentRunGameId: string | null;
  challengerScore: number | null;
  challengedScore: number | null;
  winnerId: string | null;
  completedAt: string | null;
  actions: ChallengeAction[];
}

/** Compteur de défis reçus en attente (`PendingCountView`). */
export interface PendingCount {
  count: number;
}

export interface ChallengeListParams {
  box?: ChallengeBox;
  status?: ChallengeStatus;
  page?: number;
  size?: number;
}

export const CHALLENGE_STATUS_LABEL: Record<
  Exclude<ChallengeStatus, "PENDING">,
  string
> = {
  ACCEPTED: "Accepté",
  DECLINED: "Refusé",
  EXPIRED: "Expiré",
  CANCELED: "Annulé",
  COMPLETED: "Terminé",
};

/** Issue d'un défi terminé du point de vue du joueur courant. */
export type ChallengeOutcome = "WIN" | "LOSS" | "DRAW";

export function challengeOutcome(
  status: ChallengeStatus,
  winnerId: string | null,
  viewerId: string | null,
): ChallengeOutcome | null {
  if (status !== "COMPLETED") {
    return null;
  }
  if (winnerId == null) {
    return "DRAW";
  }
  return winnerId === viewerId ? "WIN" : "LOSS";
}

export const CHALLENGE_OUTCOME_LABEL: Record<ChallengeOutcome, string> = {
  WIN: "Gagné",
  LOSS: "Perdu",
  DRAW: "Égalité",
};
