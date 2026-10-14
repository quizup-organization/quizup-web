import { useEffect, useRef } from "react"
import {
  playResultChime,
  reserveOutcomeChime,
  type DuelResultOutcome,
} from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/**
 * Son de fin de duel, joué **une fois** quand le bilan sportif devient disponible — **dès
 * l'ouverture** de la page (il l'accompagne : aucune attente ne doit rester muette, cf.
 * `useRewardRevealGate` qui enchaîne le reveal de la récompense juste après lui). Quitter la
 * page avant la fin annule le son. Une partie sans issue sportive (`null` : annulée) reste
 * muette.
 *
 * La fenêtre du son est **réservée dès la planification** (`reserveOutcomeChime`) : le reveal de
 * la récompense l'attend, pour que la salve d'XP ne recouvre jamais le son du bilan.
 */
export function useResultSound(outcome: DuelResultOutcome | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const played = useRef(false)

  useEffect(() => {
    if (!enabled || played.current || outcome == null) return
    reserveOutcomeChime(outcome, 0)
    const timer = setTimeout(() => {
      played.current = true
      playResultChime(outcome)
    }, 0)
    return () => clearTimeout(timer)
  }, [enabled, outcome])
}
