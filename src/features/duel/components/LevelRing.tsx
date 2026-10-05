import { Skeleton } from "@/components/ui/skeleton";
import { clamp } from "@/lib/helpers";
import { TOKEN } from "@/shared/theme/tokens";

interface LevelRingProps {
  level: number;
  /** Progression dans le palier courant (0–100), fournie par le BFF. */
  progressPercent: number;
  xpTotal: number;
  xpForNextLevel: number;
  /** XP gagnée sur ce duel ; `null` tant que la récompense n'est pas projetée. */
  xpGained: number | null;
}

const SIZE = 132;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Anneau de niveau de l'écran de résultat : progression dans le palier courant (BFF) et XP
 * gagnée sur le duel. Tant que la récompense n'est pas projetée, l'anneau reste à 0 et la
 * valeur affiche `···` (skeleton) — le polling de `useGameResult` le remplit.
 */
export function LevelRing({
  level,
  progressPercent,
  xpTotal,
  xpForNextLevel,
  xpGained,
}: LevelRingProps) {
  const pending = xpGained == null;
  const percent = pending ? 0 : clamp(progressPercent, 0, 100);
  const offset = CIRCUMFERENCE * (1 - percent / 100);
  const remaining = Math.max(0, xpForNextLevel - xpTotal);

  return (
    <div
      className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
      data-testid="level-ring"
    >
      <div
        className="relative grid shrink-0 place-items-center"
        style={{ width: SIZE, height: SIZE }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={TOKEN.gaugeTrack}
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={TOKEN.score}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.3,1)",
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center leading-none">
          <span
            style={{
              color: TOKEN.duelSurfaceMuted,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            NIVEAU
          </span>
          <span
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: 34,
              fontWeight: 800,
              color: TOKEN.duelSurface,
              marginTop: 4,
            }}
          >
            {pending ? "···" : level}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
        {pending ? (
          <Skeleton className="h-6 w-32 rounded-full" />
        ) : (
          <span
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: 22,
              fontWeight: 800,
              color: TOKEN.correctAccent,
            }}
          >
            +{xpGained} XP gagnée
          </span>
        )}
        <span
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: 12.5,
            marginTop: 4,
          }}
        >
          {pending ? "···" : `${remaining} XP pour le niveau ${level + 1}`}
        </span>
      </div>
    </div>
  );
}
