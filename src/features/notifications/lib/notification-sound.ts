export interface ChimeNote {
  frequency: number;
  offset: number;
  duration: number;
  gain: number;
}

export const NOTIFICATION_CHIME: readonly ChimeNote[] = [
  { frequency: 880, offset: 0, duration: 0.22, gain: 0.16 },
  { frequency: 1108.73, offset: 0.08, duration: 0.24, gain: 0.14 },
  { frequency: 1318.51, offset: 0.16, duration: 0.34, gain: 0.12 },
];

let context: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (context) return context;
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return null;
  }
  try {
    context = new window.AudioContext();
    return context;
  } catch {
    return null;
  }
}

export function playNotificationSound(): void {
  const audio = getAudioContext();
  if (!audio) return;
  if (audio.state === "suspended") {
    void audio.resume().catch(() => undefined);
  }
  const start = audio.currentTime + 0.01;
  for (const note of NOTIFICATION_CHIME) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const noteStart = start + note.offset;
    const noteEnd = noteStart + note.duration;
    oscillator.type = "sine";
    oscillator.frequency.value = note.frequency;
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(note.gain, noteStart + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd + 0.02);
  }
}
