import type { QueryClient, QueryKey } from "@tanstack/react-query"

/**
 * Réconciliation des mutations optimistes avec les **projections Axon différées** et les caches
 * BFF par réplica (cf. best-practices/.frontend/server-state.md § Mutations) : primitives
 * partagées par toutes les mutations concernées.
 */

/**
 * Fenêtre de projection Axon : une invalidation immédiate peut relire l'état précédent (ex. une
 * carte annulée qui réapparaît et semble exiger deux clics). On réconcilie toujours après.
 */
export const PROJECTION_RECONCILE_DELAY_MS = 2_000

/** Tentatives et intervalle par défaut de la boucle de convergence. */
const DEFAULT_ATTEMPTS = 6
const DEFAULT_INTERVAL_MS = 700

export interface ReconcileUntilOptions<View> {
  /**
   * Lecture **directe par le service** (jamais `fetchQuery`, qui écrirait une valeur périmée
   * dans le cache) ; `null` si la lecture échoue (on retentera).
   */
  read: () => Promise<View | null>
  /** Convergence : la lecture reflète l'intention de la mutation. */
  matches: (view: View) => boolean
  /** Plus aucune convergence possible (état terminal) : on abandonne sans attendre. */
  abort?: (view: View) => boolean
  /** Applique la vue convergée (écriture du cache propriétaire + invalidations satellites). */
  onConverged?: (view: View) => void
  /** Filet après épuisement des tentatives : la vérité serveur gagne (invalidation simple). */
  onTimeout?: () => void
  attempts?: number
  intervalMs?: number
}

/**
 * Boucle de convergence **bornée** : relit l'état serveur jusqu'à ce qu'il reflète l'intention,
 * sans jamais écrire une lecture périmée dans le cache. Retourne la vue convergée, ou `null`
 * si l'état est terminal ou le délai dépassé (`onTimeout` est alors appelé).
 */
export async function reconcileUntil<View>({
  read,
  matches,
  abort,
  onConverged,
  onTimeout,
  attempts = DEFAULT_ATTEMPTS,
  intervalMs = DEFAULT_INTERVAL_MS,
}: ReconcileUntilOptions<View>): Promise<View | null> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const view = await read()
    if (view != null) {
      if (matches(view)) {
        onConverged?.(view)
        return view
      }
      if (abort?.(view)) return null
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
  }
  onTimeout?.()
  return null
}

/**
 * Invalide des vues après la fenêtre de projection Axon — jamais immédiatement, sous peine de
 * relire l'état précédent de la commande.
 */
export function scheduleInvalidate(
  queryClient: QueryClient,
  queryKeys: QueryKey[],
  delayMs = PROJECTION_RECONCILE_DELAY_MS
): void {
  setTimeout(() => {
    for (const queryKey of queryKeys) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }, delayMs)
}

/** Retrait optimiste des listes en cache : retire les éléments satisfaisant `matches`. */
export function removeMatchingFromList<Item>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  matches: (item: Item) => boolean
): void {
  queryClient.setQueryData<Item[]>(queryKey, (current) =>
    current?.filter((item) => !matches(item))
  )
}
