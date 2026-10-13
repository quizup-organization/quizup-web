import { useEffect, useState } from "react"
import {
  playCorrectChime,
  playTimeoutChime,
  playWrongChime,
} from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import type { ArenaScene } from "../domain/arena-timeline"

export interface DuelSoundsParams {
  /** Scène projetée de l'arène (seul le type de scène pilote le son). */
  scene: Pick<ArenaScene, "kind">
  roundIndex: number
  /** Résultat de ma réponse (écho `PLAYER_ANSWERED`), `null` tant qu'inconnu. */
  yourCorrect: boolean | null
  /** Ma sélection sur le round courant (`null` = je n'ai pas répondu). */
  yourPick: string | null
}

/**
 * Sons de l'arène : **une réaction par round**, uniquement pour mes réponses.
 * - bonne/mauvaise réponse : dès l'écho serveur (`yourCorrect`), en même temps que le pop/shake ;
 * - temps écoulé : au reveal d'un round sans réponse de ma part (son neutre) ;
 * - dédup stricte par round (scène re-projetée ~50 ms, historique rejoué) ;
 * - un état déjà terminal au montage (rechargement/reconnexion) ne sonne jamais.
 */
export function useDuelSounds({
  scene,
  roundIndex,
  yourCorrect,
  yourPick,
}: DuelSoundsParams): void {
  const enabled = useSoundStore((s) => s.enabled)
  // Rounds déjà sonorisés ; au montage, un état « déjà dû » (rechargement en plein round) est
  // marqué comme joué : seules les transitions observées en direct sonnent.
  const [playedRounds] = useState(() => {
    const alreadyDue =
      yourCorrect != null || scene.kind === "reveal" || scene.kind === "result"
    return new Set<number>(alreadyDue ? [roundIndex] : [])
  })

  useEffect(() => {
    if (!enabled || playedRounds.has(roundIndex)) return
    if (yourCorrect === true) {
      playedRounds.add(roundIndex)
      playCorrectChime()
      return
    }
    if (yourCorrect === false) {
      playedRounds.add(roundIndex)
      playWrongChime()
      return
    }
    // Non-réponse : le son neutre accompagne le reveal (jamais pendant la question).
    if (scene.kind === "reveal" && yourPick == null) {
      playedRounds.add(roundIndex)
      playTimeoutChime()
    }
  }, [enabled, playedRounds, roundIndex, yourCorrect, yourPick, scene.kind])
}
