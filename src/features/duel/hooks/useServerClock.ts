import { useCallback, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { clockService } from "../lib/clock";

export interface ServerClock {
  /** Instant serveur courant estimé (ms epoch), corrigé du décalage d'horloge. */
  serverNow: () => number;
  /** Vrai dès que le décalage a été mesuré (sinon l'horloge locale sert de repli). */
  synced: boolean;
}

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const SYNC_RETRY_INTERVAL_MS = 3_000;

/**
 * Horloge serveur : mesure le décalage entre l'horloge locale et `GET /api/clock`.
 * Les échéances absolues (deadline de question) sont ainsi fiables quel que soit le skew
 * de l'horloge cliente — le chrono est piloté par le serveur, pas par le client.
 * Tant que la mesure n'a pas abouti (connexion lente), on retente toutes les 3 s : le chrono
 * de duel et la détection des transitions en retard en dépendent.
 */
export function useServerClock(): ServerClock {
  const offsetRef = useRef(0);
  const { data } = useQuery({
    queryKey: queryKeys.serverTime(),
    queryFn: () => clockService.get(),
    refetchInterval: (query) =>
      query.state.data ? SYNC_INTERVAL_MS : SYNC_RETRY_INTERVAL_MS,
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
