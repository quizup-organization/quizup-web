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
