/**
 * Réconciliation d'une mutation optimiste avec une source de vérité **éventuellement cohérente**
 * (projections Axon différées, caches BFF répliqués).
 *
 * Anti-pattern remplacé : `onSettled -> setTimeout(2 s) -> invalidateQueries`. Une relecture qui
 * arrive avant la projection **écrase l'état optimiste** avec une valeur périmée ; ce résultat est
 * alors considéré frais (`staleTime`) et l'utilisateur doit recharger la page. Ici on relit via le
 * **service** (jamais `fetchQuery`, qui écrirait la valeur périmée dans le cache) jusqu'à observer
 * l'intention de la mutation, puis seulement on applique la réponse confirmée — sinon on invalide
 * en secours (la vérité serveur gagne).
 *
 * Voir `best-practices/.frontend/server-state.md` (section Mutations).
 */
export interface ReconcileUntilOptions<T> {
  /** Relit la source de vérité sans passer par le cache React Query. */
  read: () => Promise<T>;
  /** Vrai quand la réponse serveur reflète l'intention de la mutation. */
  matches: (view: T) => boolean;
  /** Réponse confirmée : écriture `setQueryData` + invalidation des vues satellites. */
  onConverged: (view: T) => void;
  /** Convergence non observée dans le budget : invalidation de secours. */
  onTimeout: () => void;
  /** Nombre de lectures maximum (défaut 6). */
  attempts?: number;
  /** Délai entre deux lectures (défaut 700 ms). */
  intervalMs?: number;
  /** Injectable pour les tests. */
  sleep?: (ms: number) => Promise<void>;
}

export const RECONCILE_ATTEMPTS = 6;
export const RECONCILE_INTERVAL_MS = 700;

export async function reconcileUntil<T>({
  read,
  matches,
  onConverged,
  onTimeout,
  attempts = RECONCILE_ATTEMPTS,
  intervalMs = RECONCILE_INTERVAL_MS,
  sleep = defaultSleep,
}: ReconcileUntilOptions<T>): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const view = await read().catch(() => null);
    if (view !== null && matches(view)) {
      onConverged(view);
      return;
    }
    if (attempt < attempts - 1) {
      await sleep(intervalMs);
    }
  }
  onTimeout();
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
