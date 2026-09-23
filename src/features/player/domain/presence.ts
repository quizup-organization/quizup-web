/** Présence temps réel d'un joueur. */
export interface Presence {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}
