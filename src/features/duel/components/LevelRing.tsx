import { clamp } from "@/lib/helpers"
import { TOKEN } from "@/shared/theme/tokens"

interface LevelRingProps {
  level: number
  /** Progression dans le palier courant (0–100), fournie par le BFF. */
  progressPercent: number
  xpTotal: number
  xpForNextLevel: number
  /** XP gagnée sur ce duel ; `null` tant que la récompense n'est pas projetée. */
  xpGained: number | null
}

const VIEWBOX = 160
const STROKE = 22
const RADIUS = (VIEWBOX - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const RING_SIZE = "clamp(108px, 18dvh, 156px)"
/** Coral de la maquette (anneau de progression + callout « XP gagnée »). */
const CORAL = "#f58a9b"
const WHITE = "#ffffff"

const CALLOUT_LABEL = {
  fontSize: "clamp(7px, 1dvh, 9px)",
  fontWeight: 700,
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
} as const

const CALLOUT_VALUE = {
  fontFamily: TOKEN.fontDisplay,
  fontSize: "clamp(15px, 2.4dvh, 22px)",
  fontWeight: 800,
  lineHeight: 1.1,
} as const

/**
 * Anneau de niveau de l'écran de résultat (maquette `img_6`) : piste blanche, arc coral de
 * progression dans le palier courant, centre sombre `LEVEL` + niveau, et deux callouts pointés —
 * **XP pour le niveau suivant** en bas-gauche (blanc), **XP gagnée** en haut-droite (coral). Tant
 * que la récompense n'est pas projetée, les callouts affichent `···`.
 */
export function LevelRing({
  level,
  progressPercent,
  xpTotal,
  xpForNextLevel,
  xpGained,
}: LevelRingProps) {
  const pending = xpGained == null
  const percent = pending ? 0 : clamp(progressPercent, 0, 100)
  const offset = CIRCUMFERENCE * (1 - percent / 100)
  const remaining = Math.max(0, xpForNextLevel - xpTotal)

  return (
    <div className="flex items-center justify-center" data-testid="level-ring">
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <div
          className="absolute flex items-center"
          style={{ right: "calc(100% - 2px)", top: "64%" }}
        >
          <div className="text-right">
            <div style={{ ...CALLOUT_LABEL, color: WHITE }}>
              XP POUR LE NIVEAU {level + 1}
            </div>
            <div
              style={{
                ...CALLOUT_VALUE,
                color: pending ? TOKEN.duelSurfaceMuted : WHITE,
              }}
            >
              {pending ? "···" : remaining}
            </div>
          </div>
          <div
            style={{
              width: "clamp(12px, 2.6vw, 26px)",
              height: 1,
              background: TOKEN.duelSurfaceMuted,
            }}
          />
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: TOKEN.duelSurfaceMuted,
            }}
          />
        </div>

        <svg
          viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
          className="h-full w-full -rotate-90"
          aria-hidden
        >
          <circle
            cx={VIEWBOX / 2}
            cy={VIEWBOX / 2}
            r={RADIUS}
            fill="none"
            stroke={WHITE}
            strokeWidth={STROKE}
          />
          {!pending && (
            <circle
              cx={VIEWBOX / 2}
              cy={VIEWBOX / 2}
              r={RADIUS}
              fill="none"
              stroke={CORAL}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset .6s cubic-bezier(.2,.8,.3,1)",
              }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            style={{
              color: TOKEN.duelSurfaceMuted,
              fontSize: "clamp(8px, 1.1dvh, 11px)",
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            LEVEL
          </span>
          <span
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: "clamp(22px, 4.6dvh, 36px)",
              fontWeight: 800,
              color: WHITE,
              marginTop: 2,
            }}
          >
            {level}
          </span>
        </div>

        <div
          className="absolute flex items-center"
          style={{ left: "calc(100% - 2px)", top: "20%" }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: CORAL,
            }}
          />
          <div
            style={{
              width: "clamp(12px, 2.6vw, 26px)",
              height: 1,
              background: CORAL,
            }}
          />
          <div>
            <div style={{ ...CALLOUT_LABEL, color: CORAL }}>XP GAGNÉE</div>
            <div style={{ ...CALLOUT_VALUE, color: CORAL }}>
              {pending ? "···" : xpGained}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
