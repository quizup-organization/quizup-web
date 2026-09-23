/**
 * Modèle métier « défi » (contrat partagé entre features) + règles pures (aucun React, aucun
 * fetch) — le composant ne calcule jamais le cycle de vie inline.
 */
export type ChallengeStatus =
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED";

export interface Challenge {
  challengeId: string;
  challengerId: string;
  challengedId: string;
  topicId: string;
  gameId: string | null;
  challengerGameId: string | null;
  challengedGameId: string | null;
  replayGameId: string | null;
  status: ChallengeStatus;
  createdAt: string;
  acceptedAt: string | null;
  declinedAt: string | null;
  expiresAt: string;
}

export const CHALLENGE_STATUS_LABEL: Record<
  Exclude<ChallengeStatus, "PENDING">,
  string
> = {
  ACCEPTED: "Accepté",
  DECLINED: "Refusé",
  EXPIRED: "Expiré",
  CANCELED: "Annulé",
};

/** Un défi n'est plus en attente dès qu'il quitte `PENDING`. */
export function isTerminal(status: ChallengeStatus): boolean {
  return status !== "PENDING";
}

/** Sens du défi vu par `userId` : envoyé (instigateur) ou reçu (défié). */
export function directionOf(
  challenge: Challenge,
  userId: string,
): "sent" | "received" {
  return challenge.challengerId === userId ? "sent" : "received";
}

/** Seul l'instigateur peut annuler, et uniquement tant que le défi est en attente. */
export function canCancel(challenge: Challenge, userId: string): boolean {
  return challenge.status === "PENDING" && challenge.challengerId === userId;
}
