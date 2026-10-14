import type { NotificationType } from "@/shared/types/notifications"

/** Note d'un motif sonore : fréquence (Hz), décalage et durée (s), gain crête (0–1). */
export interface ChimeNote {
  frequency: number
  offset: number
  duration: number
  gain: number
}

/** Motif sonore : suite de notes jouées par `playChime` (offsets croissants). */
export type Chime = readonly ChimeNote[]

/** Issue sportive d'une partie terminée (son de fin de duel). */
export type DuelResultOutcome = "win" | "loss" | "draw"

/** Notification générique — trois notes montantes courtes, esprit « Tri-tone » iOS. */
export const NOTIFICATION_CHIME: Chime = [
  { frequency: 1046.5, offset: 0, duration: 0.16, gain: 0.14 },
  { frequency: 1318.51, offset: 0.085, duration: 0.16, gain: 0.13 },
  { frequency: 1567.98, offset: 0.17, duration: 0.28, gain: 0.12 },
]

/** Défi accepté — montée lumineuse, plus ample qu'une notification générique. */
export const NOTIFICATION_ACCEPTED_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.12, gain: 0.13 },
  { frequency: 1046.5, offset: 0.07, duration: 0.12, gain: 0.13 },
  { frequency: 1318.51, offset: 0.14, duration: 0.24, gain: 0.12 },
]

/** Défi refusé — descente douce, non punitive. */
export const NOTIFICATION_DECLINED_CHIME: Chime = [
  { frequency: 659.26, offset: 0, duration: 0.16, gain: 0.12 },
  { frequency: 523.25, offset: 0.1, duration: 0.26, gain: 0.11 },
]

/** Bonne réponse en duel — montée claire. */
export const CORRECT_CHIME: Chime = [
  { frequency: 1318.51, offset: 0, duration: 0.12, gain: 0.14 },
  { frequency: 1975.53, offset: 0.08, duration: 0.26, gain: 0.13 },
]

/** Mauvaise réponse en duel — descente douce. */
export const WRONG_CHIME: Chime = [
  { frequency: 440, offset: 0, duration: 0.14, gain: 0.13 },
  { frequency: 329.63, offset: 0.09, duration: 0.26, gain: 0.12 },
]

/** Temps écoulé sans réponse — neutre et discret (ni correct, ni faux). */
export const TIMEOUT_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.18, gain: 0.11 },
  { frequency: 587.33, offset: 0.14, duration: 0.3, gain: 0.1 },
]

/** L'adversaire a répondu — double blip neutre, discret (ni bien, ni mal). */
export const OPPONENT_CHIME: Chime = [
  { frequency: 880, offset: 0, duration: 0.06, gain: 0.11 },
  { frequency: 880, offset: 0.07, duration: 0.14, gain: 0.1 },
]

/** Victoire — arpège majeur montant. */
export const VICTORY_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.14, gain: 0.13 },
  { frequency: 1046.5, offset: 0.09, duration: 0.14, gain: 0.13 },
  { frequency: 1318.51, offset: 0.18, duration: 0.14, gain: 0.13 },
  { frequency: 1567.98, offset: 0.27, duration: 0.36, gain: 0.12 },
]

/** Défaite — descente mineure, sobre. */
export const DEFEAT_CHIME: Chime = [
  { frequency: 440, offset: 0, duration: 0.18, gain: 0.12 },
  { frequency: 349.23, offset: 0.12, duration: 0.18, gain: 0.12 },
  { frequency: 293.66, offset: 0.24, duration: 0.4, gain: 0.11 },
]

/** Égalité — quinte neutre. */
export const DRAW_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.18, gain: 0.12 },
  { frequency: 1174.66, offset: 0.12, duration: 0.32, gain: 0.11 },
]

/** Enregistrement/action réussis — « ding » discret. */
export const SUCCESS_CHIME: Chime = [
  { frequency: 1046.5, offset: 0, duration: 0.1, gain: 0.13 },
  { frequency: 1318.51, offset: 0.055, duration: 0.16, gain: 0.12 },
]

/**
 * Cadence des ticks d'accumulation (points du duel, XP de l'anneau de résultat) : 70 ms, soit
 * une salve de 8 ticks ≈ 0,5 s (compteur de l'arène) à 12 ticks ≈ 0,8 s (reveal de l'anneau).
 */
export const ACCUMULATION_TICK_INTERVAL_MS = 70
/** Nombre de ticks minimum (un motif doit avoir au moins deux notes). */
const ACCUMULATION_MIN_TICKS = 2
/** Nombre de ticks maximum (12 × 70 ms ≈ 0,8 s : borne dure sous la seconde). */
const ACCUMULATION_MAX_TICKS = 12
const ACCUMULATION_TICK_DURATION_S = 0.045
/** Gain sous celui du « ding » de bonne réponse (0,14) : l'accumulation ne le masque pas. */
const ACCUMULATION_TICK_GAIN = 0.11
const ACCUMULATION_BASE_FREQUENCY = 880
const SEMITONE_RATIO = 2 ** (1 / 12)

/**
 * Salve d'accumulation : `count` ticks très courts dont la hauteur monte d'un demi-ton par pas
 * (sensation de compteur qui grimpe). Le nombre de ticks est décidé par l'appelant
 * (`features/game/domain/accumulation.ts`) ; le bornage ici garantit ≥ 2 notes et une salve
 * entièrement contenue dans la seconde (contrainte des motifs, cf. `chimes.test.ts`).
 */
export function accumulationChime(count: number): Chime {
  const ticks = Number.isFinite(count)
    ? Math.max(
        ACCUMULATION_MIN_TICKS,
        Math.min(ACCUMULATION_MAX_TICKS, Math.round(count))
      )
    : ACCUMULATION_MIN_TICKS

  return Array.from({ length: ticks }, (_, index) => ({
    frequency: ACCUMULATION_BASE_FREQUENCY * SEMITONE_RATIO ** index,
    offset: (index * ACCUMULATION_TICK_INTERVAL_MS) / 1000,
    duration: ACCUMULATION_TICK_DURATION_S,
    gain: ACCUMULATION_TICK_GAIN,
  }))
}

/** Durée (ms) d'un motif : fin de sa dernière note (arrondie, les durées sont posées en secondes). */
export function chimeDurationMs(chime: Chime): number {
  return Math.round(
    Math.max(...chime.map((note) => note.offset + note.duration)) * 1000
  )
}

/** Motif du bilan sportif associé à une issue (victoire, défaite, égalité). */
export function resultChime(outcome: DuelResultOutcome): Chime {
  if (outcome === "win") return VICTORY_CHIME
  if (outcome === "loss") return DEFEAT_CHIME
  return DRAW_CHIME
}

/** Motif d'une notification selon son type : générique pour les suivis et défis reçus. */
export function notificationChime(type?: NotificationType | null): Chime {
  switch (type) {
    case "ROOM_ACCEPTED":
      return NOTIFICATION_ACCEPTED_CHIME
    case "CHALLENGE_DECLINED":
      return NOTIFICATION_DECLINED_CHIME
    default:
      return NOTIFICATION_CHIME
  }
}
