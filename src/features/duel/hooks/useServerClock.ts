import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { gamesService } from "@/lib/services/games";

export interface ServerClock {
  /** Instant serveur courant estimé (ms epoch), corrigé du décalage d'horloge. */
  serverNow: () => number;
  /** Vrai dès que le décalage a été mesuré (sinon l'horloge locale sert de repli). */
  synced: boolean;
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Horloge serveur : mesure le décalage entre l'horloge locale et `GET /api/games/time`.
 * Les échéances absolues (deadline de question) sont ainsi fiables quel que soit le skew
 * de l'horloge cliente — le chrono est piloté par le serveur, pas par le client.
 */
export function useServerClock(): ServerClock {
  const offsetRef = useRef(0);
  const { data } = useQuery({
    queryKey: ["games", "server-time"],
    queryFn: () => gamesService.serverTime(),
    refetchInterval: SYNC_INTERVAL_MS,
    staleTime: SYNC_INTERVAL_MS,
  });

  useEffect(() => {
    if (!data) return;
    offsetRef.current = data.epochMillis - Date.now();
  }, [data]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);
  return { serverNow, synced: data != null };
}

/** Convertit un instant ISO (renvoyé par l'API) en ms epoch. */
export function instantToMillis(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}
