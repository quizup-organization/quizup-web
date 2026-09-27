/** État de présence d'un joueur (enum backend `PresenceStatus`). */
export type PresenceStatus = "ONLINE" | "OFFLINE";

/** Présence d'un joueur (`PresenceView`, REST et push WS). */
export interface Presence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string | null;
}

/** Un joueur est en ligne quand sa session temps réel est ouverte. */
export function isOnline(presence: Presence | null | undefined): boolean {
  return presence?.status === "ONLINE";
}
