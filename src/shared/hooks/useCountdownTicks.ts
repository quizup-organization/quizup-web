import { useEffect } from "react"
import { playCountdownTick, playWaitTick } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/**
 * Tic-tac des écrans à countdown (`Countdown` Arc UI : appariement, TTL des défis, expiration
 * d'une salle, chrono de réponse du duel). Un tic court par seconde **dans les dix dernières
 * secondes** uniquement — les échéances d'une heure ou d'un jour seraient sinon insupportables —
 * avec hauteur alternée (tic/tac) et tension sur les trois dernières secondes
 * (`countdownTickChime`).
 *
 * `continuous` (salon d'attente) : tic-tac **dès maintenant**, sans attendre la fenêtre — même
 * alternance mais sans tension tant que l'échéance est loin, puis tension normale quand elle
 * entre dans les dix dernières secondes (salon qui expire).
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
  /**
   * Tic-tac **continu** (salon d'attente) : sonne dès maintenant sans attendre la fenêtre des
   * dix dernières secondes ; la tension n'apparaît qu'à l'approche de l'échéance.
   */
  continuous?: boolean
}

export function useCountdownTicks({
  deadlineAt,
  clock,
  continuous = false,
}: CountdownTicksOptions): void {
  const enabled = useSoundStore((s) => s.enabled)

  useEffect(() => {
    const deadline = deadlineEpochMs(deadlineAt)
    if (!enabled) return
    if (deadline == null && !continuous) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let lastSecond = Number.POSITIVE_INFINITY
    let waitIndex = 0

    const arm = (delayMs: number) => {
      timer = setTimeout(tick, Math.max(COUNTDOWN_TICK_MIN_DELAY_MS, delayMs))
    }

    // Chaîne de `setTimeout` : hors fenêtre on dort jusqu'à son début (ou on tictaque en attente
    // si `continuous`), dans la fenêtre on se cale sur chaque frontière de seconde (aucun tic en
    // double, aucune dérive).
    const tick = () => {
      timer = null
      if (document.visibilityState === "hidden") {
        arm(HIDDEN_RETRY_MS)
        return
      }
      const remaining = deadline != null ? deadline - clock() : null
      if (remaining != null && remaining <= 0) return

      if (remaining != null && remaining > COUNTDOWN_TICK_WINDOW_MS) {
        if (!continuous) {
          arm(remaining - COUNTDOWN_TICK_WINDOW_MS)
          return
        }
        // Attente loin de l'échéance : alternance neutre, cadence d'une seconde.
        playWaitTick(waitIndex)
        waitIndex += 1
        arm(SECOND_MS)
        return
      }

      const second =
        remaining != null ? Math.ceil(remaining / SECOND_MS) : (waitIndex += 1)
      if (second < lastSecond) {
        lastSecond = second
        playCountdownTick(second)
      }
      arm(remaining != null ? remaining - (second - 1) * SECOND_MS : SECOND_MS)
    }

    tick()
    return () => {
      if (timer != null) clearTimeout(timer)
    }
  }, [enabled, deadlineAt, clock, continuous])
}
