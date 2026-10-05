import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Durée du comptage (ms), alignée sur les transitions de l'arène (jauges, scores). */
  duration?: number;
}

/**
 * Compteur « horloge numérique » : incrémente de 1 en 1 vers la valeur cible, sur la même
 * durée que la transition des jauges latérales (`height .55s`).
 */
export function AnimatedNumber({ value, duration = 550 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);

  useEffect(() => {
    const from = ref.current;
    if (from === value) return;
    const steps = Math.abs(value - from);
    const dir = Math.sign(value - from);
    const stepMs = Math.max(16, Math.round(duration / steps));
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const next = from + dir * Math.min(i, steps);
      ref.current = next;
      setDisplay(next);
      if (i >= steps) clearInterval(id);
    }, stepMs);
    return () => clearInterval(id);
  }, [value, duration]);

  return <>{display}</>;
}
