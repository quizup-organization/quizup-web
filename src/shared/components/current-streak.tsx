import { cn } from "cn";
import {
  streakLetter,
  type StreakLanguage,
  type StreakResult,
} from "@/shared/utils/streak";

interface CurrentStreakProps {
  /** Série en cours (`null` = rien à afficher). */
  streak: StreakResult | null;
  /** Langue du viewer : FR V/D/N, EN W/L/D. */
  language: StreakLanguage;
  /** Nombre maximal de ronds affichés (au-delà : pastille `+N`). */
  max?: number;
  className?: string;
}

/** Ronds pleins dans la palette de la barre V/N/D ; lettre contrastée selon le fond. */
const DISC_CLASSES: Record<StreakResult["outcome"], string> = {
  WIN: "bg-win text-background",
  LOSS: "bg-loss text-background",
  DRAW: "bg-draw text-black/80",
};

const CAPTION: Record<StreakLanguage, string> = {
  fr: "Série actuelle",
  en: "Current streak",
};

/**
 * Série actuelle d'un joueur : un rond plein par résultat consécutif identique (le plus récent
 * à gauche), lettre V/D/N ou W/L/D selon la langue du viewer, mêmes couleurs que `WinLossBar`.
 * Plafonnée à `max` ronds, puis `+N`. Purement présentationnel.
 */
export function CurrentStreak({
  streak,
  language,
  max = 10,
  className,
}: CurrentStreakProps) {
  if (!streak) {
    return null;
  }
  const shown = Math.min(streak.count, max);
  const hidden = streak.count - shown;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-xs text-muted-foreground">{CAPTION[language]}</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: shown }, (_, index) => (
          <span
            key={index}
            className={cn(
              "grid size-6 place-items-center rounded-full text-2xs font-bold",
              DISC_CLASSES[streak.outcome],
            )}
          >
            {streakLetter(streak.outcome, language)}
          </span>
        ))}
        {hidden > 0 && (
          <span className="ml-0.5 text-xs font-semibold text-muted-foreground">
            +{hidden}
          </span>
        )}
      </div>
    </div>
  );
}
