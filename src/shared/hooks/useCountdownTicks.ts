import { useEffect } from "react"
import { playCountdownTick } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/**
 * Tic-tac des écrans à countdown (`Countdown` Arc UI : appariement, TTL des défis en attente,
 * expiration d'une salle). Un tic court par seconde **dans les dix dernières secondes**
 * uniquement — les échéances d'une heure ou d'un jour seraient sinon insupportables — avec
 * hauteur alternée (tic/tac) et tension sur les trois dernières secondes (`countdownTickChime`).
 *
 * Muet quand l'interrupteur « Sons » est coupé, quand l'onglet est masqué (on ne sonorise pas un
 * écran qu'on ne regarde pas : le tic reprend au retour) et après l'échéance. **Une seule
 * échéance par écran** : plusieurs countdowns ne doivent jamais superposer leurs tics
 * (`nearestDeadline`).
 */
export const COUNTDOWN_TICK_WINDOW_MS = 10_000
/** Délai minimal entre deux tics (garde-fou anti-boucle sur une frontière de seconde). */
const COUNTDOWN_TICK_MIN_DELAY_MS = 50
/** Réessai (ms) tant que l'onglet reste masqué. */
const HIDDEN_RETRY_MS = 1_000
const SECOND_MS = 1_000

/** Échéance acceptée par le hook : epoch ms, ISO 8601 (horodatage serveur) ou `Date`. */
export type DeadlineTarget = number | string | Date | null | undefined

/** Échéance en epoch ms ; `null` si absente ou illisible. */
export function deadlineEpochMs(target: DeadlineTarget): number | null {
  if (target == null) return null
  const parsed =
    typeof target === "number"
      ? target
      : target instanceof Date
        ? target.getTime()
        : Date.parse(target)
  return Number.isFinite(parsed) ? parsed : null
}

/** Échéance la plus proche d'une liste (une seule source de tic-tac par écran) ; `null` si vide. */
export function nearestDeadline(
  targets: readonly DeadlineTarget[]
): number | null {
  return targets.reduce<number | null>((nearest, target) => {
    const epoch = deadlineEpochMs(target)
    if (epoch == null) return nearest
    return nearest == null || epoch < nearest ? epoch : nearest
  }, null)
}

export interface CountdownTicksOptions {
  /** Échéance du countdown **le plus proche** de l'écran ; `null` = aucun countdown actif. */
  deadlineAt: DeadlineTarget
  /** Horloge en epoch ms — toujours celle du serveur (`useServerClock`). */
  clock: () => number
}

export function useCountdownTicks({
  deadlineAt,
  clock,
}: CountdownTicksOptions): void {
  const enabled = useSoundStore((s) => s.enabled)

  useEffect(() => {
    const deadline = deadlineEpochMs(deadlineAt)
    if (!enabled || deadline == null) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let lastSecond = Number.POSITIVE_INFINITY

    const arm = (delayMs: number) => {
      timer = setTimeout(tick, Math.max(COUNTDOWN_TICK_MIN_DELAY_MS, delayMs))
    }

    // Chaîne de `setTimeout` : hors fenêtre on dort jusqu'à son début, dans la fenêtre on se
    // cale sur chaque frontière de seconde (aucun tic en double, aucune dérive).
    const tick = () => {
      timer = null
      if (document.visibilityState === "hidden") {
        arm(HIDDEN_RETRY_MS)
        return
      }
      const remaining = deadline - clock()
      if (remaining <= 0) return
      if (remaining > COUNTDOWN_TICK_WINDOW_MS) {
        arm(remaining - COUNTDOWN_TICK_WINDOW_MS)
        return
      }
      const second = Math.ceil(remaining / SECOND_MS)
      if (second < lastSecond) {
        lastSecond = second
        playCountdownTick(second)
      }
      arm(remaining - (second - 1) * SECOND_MS)
    }

    tick()
    return () => {
      if (timer != null) clearTimeout(timer)
    }
  }, [enabled, deadlineAt, clock])
}
