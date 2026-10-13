import { useEffect, useState } from "react"
import {
  playCorrectChime,
  playOpponentChime,
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
  /** Sélection de l'adversaire sur le round courant (`null` = pas encore répondu). */
  theirPick: string | null
}

/**
 * Sons de l'arène : **une réaction par round et par événement**, jamais rejouée.
 * - mes réponses : bonne/mauvaise dès l'écho serveur (`yourCorrect`), son neutre au reveal
 *   quand je n'ai pas répondu ;
 * - adversaire : blip discret quand sa réponse arrive **en phase de réponse** (humain ou bot) —
 *   silencieux si l'écho tombe pendant le reveal (tout y est déjà visible) ;
 * - dédup stricte par round (scène re-projetée ~50 ms, historique rejoué) ;
 * - un état déjà terminal au montage (rechargement/reconnexion) ne sonne jamais.
 */
export function useDuelSounds({
  scene,
  roundIndex,
  yourCorrect,
  yourPick,
  theirPick,
}: DuelSoundsParams): void {
  const enabled = useSoundStore((s) => s.enabled)
  // Rounds déjà sonorisés ; au montage, un état « déjà dû » (rechargement en plein round) est
  // marqué comme joué : seules les transitions observées en direct sonnent.
  const [playedRounds] = useState(() => {
    const alreadyDue =
      yourCorrect != null || scene.kind === "reveal" || scene.kind === "result"
    return new Set<number>(alreadyDue ? [roundIndex] : [])
  })
  const [announcedOpponentRounds] = useState(
    () => new Set<number>(theirPick != null ? [roundIndex] : [])
  )

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

  useEffect(() => {
    if (!enabled || announcedOpponentRounds.has(roundIndex)) return
    if (theirPick == null) return
    announcedOpponentRounds.add(roundIndex)
    // Écho pendant le reveal : tout y est déjà visible, pas de blip rétroactif.
    if (scene.kind === "question") playOpponentChime()
  }, [enabled, announcedOpponentRounds, roundIndex, theirPick, scene.kind])
}
