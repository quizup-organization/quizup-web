import { useEffect, useRef } from "react"
import { playResultChime, type DuelResultOutcome } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"

/**
 * Son de fin de duel, joué **une fois** quand le bilan sportif devient disponible — **dès
 * l'ouverture** de la page (il l'accompagne). Quitter la page avant la fin annule le son. Une
 * partie sans issue sportive (`null` : annulée) reste muette.
 */
export function useResultSound(outcome: DuelResultOutcome | null): void {
  const enabled = useSoundStore((s) => s.enabled)
  const played = useRef(false)

  useEffect(() => {
    if (!enabled || played.current || outcome == null) return
    const timer = setTimeout(() => {
      played.current = true
      playResultChime(outcome)
    }, 0)
    return () => clearTimeout(timer)
  }, [enabled, outcome])
}
