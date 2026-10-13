import type { Chime } from "./chimes"

let context: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (context) return context
  if (
    typeof window === "undefined" ||
    typeof window.AudioContext === "undefined"
  ) {
    return null
  }
  try {
    context = new window.AudioContext()
    return context
  } catch {
    return null
  }
}

/**
 * Joue un motif sonore (best-effort) : silencieux si l'API Web Audio est indisponible, reprise
 * du contexte `suspended` (politique d'autoplay), **aucune exception** ne remonte à l'appelant.
 * Un unique `AudioContext` est partagé par tous les sons.
 */
export function playChime(chime: Chime): void {
  const audio = getAudioContext()
  if (!audio) return
  if (audio.state === "suspended") {
    void audio.resume().catch(() => undefined)
  }
  const start = audio.currentTime + 0.01
  for (const note of chime) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    const noteStart = start + note.offset
    const noteEnd = noteStart + note.duration
    oscillator.type = "sine"
    oscillator.frequency.value = note.frequency
    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(note.gain, noteStart + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd)
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start(noteStart)
    oscillator.stop(noteEnd + 0.02)
  }
}
