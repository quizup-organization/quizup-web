import { useTranslation } from "react-i18next"
import { TOKEN } from "@/shared/theme/tokens"
import { useRingReveal } from "../hooks/useRingReveal"
import { RESULT_WHITE, RESULT_XP } from "./result/palette"

interface LevelRingProps {
  level: number
  xpTotal: number
  xpForNextLevel: number
  /** XP gagnée sur ce duel ; `null` tant que la récompense n'est pas projetée. */
  xpGained: number | null
}

const VIEWBOX = 160
/** Épaisseur de la maquette : l'anneau occupe ~18,5 % du diamètre (trou ~63 %). */
const STROKE = 30
const RADIUS = (VIEWBOX - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const RING_SIZE = "var(--duel-ring-size)"
const RAD = Math.PI / 180

/** Tailles de la maquette, proportionnelles à l'anneau (label ~6 %, valeur ~20 %, niveau ~27 %). */
const CALLOUT_LABEL = {
  fontSize: `calc(${RING_SIZE} * 0.06)`,
  fontWeight: 700,
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
} as const

const CALLOUT_VALUE = {
  fontFamily: TOKEN.fontDisplay,
  fontSize: `calc(${RING_SIZE} * 0.2)`,
  fontWeight: 800,
  lineHeight: 1.1,
} as const

/** Trait + pastille des callouts, à l'échelle de l'anneau. */
const LINE = {
  width: `calc(${RING_SIZE} * 0.16)`,
  height: 2,
  flexShrink: 0,
} as const

const DOT = {
  width: `calc(${RING_SIZE} * 0.035)`,
  height: `calc(${RING_SIZE} * 0.035)`,
  borderRadius: 999,
  flexShrink: 0,
} as const

/** Gouttière entre la pastille et le texte du callout. */
const CALLOUT_GAP = `calc(${RING_SIZE} * 0.035)`

/**
 * Anneau de niveau de l'écran de résultat (maquette `img_6`) : piste blanche, segment corail de
 * l'**XP gagnée sur ce duel**, segment blanc de l'**XP restante avant le niveau suivant** — les
 * deux callouts chiffrés sont les deux segments de l'anneau (corail pointé au milieu de son arc
 * en haut à droite, reste pointé au milieu du blanc en bas à gauche, pastille côté texte).
 * Le rouge du segment est dérivé du bouton Rejouer (`RESULT_XP`). Le donut **entre** dès que la
 * récompense est projetée — animation d'ouverture de page (`qu-pop`), puis remplissage de l'arc
 * et compteur « XP gagnée » de 0 à sa valeur (`useRingReveal`, une fois par affichage), **dès
 * l'entrée dans la page résultat** quand la récompense y est déjà (cas courant). Tant qu'elle
 * n'est pas projetée il n'y a **aucun état transitoire** : la place est réservée, le composant
 * invisible (jamais de `···`, jamais d'anneau vide).
 */
export function LevelRing({
  level,
  xpTotal,
  xpForNextLevel,
  xpGained,
}: LevelRingProps) {
  const { t } = useTranslation()
  const pending = xpGained == null
  const revealed = !pending
  const gained = xpGained ?? 0
  const remaining = Math.max(0, xpForNextLevel - xpTotal)
  const total = gained + remaining
  const targetPercent = !pending && total > 0 ? (gained / total) * 100 : 0
  const {
    percent,
    gained: shownGained,
    valueOpacity,
  } = useRingReveal(targetPercent, gained, revealed)
  const fill = percent
  const offset = CIRCUMFERENCE * (1 - fill / 100)

  // Tracés pointés au **milieu** de leur segment (maquette) : corail à 1,8°·p (36° pour 20 %),
  // blanc à l'opposé (216° pour 20 %). La hauteur suit le cosinus, l'ancre X la projection sur le
  // bord extérieur de l'anneau (rayon = 50 % de la boîte). Les deux positions sont **bornées à
  // celles de la maquette** (36° / 216°) : plus près du sommet ou du bas, le texte des callouts
  // passerait sous la bande blanche (gain faible ou nul).
  const coralMid = Math.max(36, 1.8 * fill) * RAD
  const whiteMid = Math.max(216, 180 + 1.8 * fill) * RAD
  const coralTop = `${(1 - Math.cos(coralMid)) * 50}%`
  const whiteTop = `${(1 - Math.cos(whiteMid)) * 50}%`
  const coralLeft = `calc(50% + ${(50 * Math.sin(coralMid)).toFixed(2)}%)`
  const whiteRight = `calc(50% + ${(-50 * Math.sin(whiteMid)).toFixed(2)}%)`

  return (
    <div
      className={`flex items-center justify-center ${revealed ? "qu-pop" : ""}`}
      data-testid="level-ring"
      role="img"
      style={revealed ? undefined : { opacity: 0 }}
      aria-label={
        revealed
          ? t("game.result.ringAria", {
              level,
              gained,
              remaining,
              next: level + 1,
            })
          : t("game.result.level", { level })
      }
    >
      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        {/* Callout « reste avant le niveau suivant » : pointé au milieu du segment blanc. */}
        <div
          className="absolute flex -translate-y-1/2 items-center"
          style={{ right: whiteRight, top: whiteTop }}
        >
          <div
            className="text-right"
            style={{
              marginRight: CALLOUT_GAP,
              opacity: valueOpacity,
            }}
          >
            <div style={{ ...CALLOUT_LABEL, color: RESULT_WHITE }}>
              {t("game.result.xpForLevel", { level: level + 1 })}
            </div>
            <div style={{ ...CALLOUT_VALUE, color: RESULT_WHITE }}>
              {remaining}
            </div>
          </div>
          <div style={{ ...DOT, background: RESULT_WHITE }} />
          <div style={{ ...LINE, background: RESULT_WHITE }} />
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
            stroke={RESULT_WHITE}
            strokeWidth={STROKE}
          />
          {!pending && (
            <circle
              data-testid="level-ring-fill"
              cx={VIEWBOX / 2}
              cy={VIEWBOX / 2}
              r={RADIUS}
              fill="none"
              stroke={RESULT_XP}
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            style={{
              color: RESULT_WHITE,
              fontSize: `calc(${RING_SIZE} * 0.075)`,
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            {t("game.result.levelLabel")}
          </span>
          <span
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: `calc(${RING_SIZE} * 0.27)`,
              fontWeight: 800,
              color: RESULT_WHITE,
              marginTop: `calc(${RING_SIZE} * 0.03)`,
            }}
          >
            {level}
          </span>
        </div>

        {/* Callout « XP gagnée » : pointé au milieu du segment corail. */}
        <div
          className="absolute flex -translate-y-1/2 items-center"
          style={{ left: coralLeft, top: coralTop }}
        >
          <div style={{ ...LINE, background: RESULT_XP }} />
          <div style={{ ...DOT, background: RESULT_XP }} />
          <div
            style={{
              marginLeft: CALLOUT_GAP,
              opacity: valueOpacity,
            }}
          >
            <div style={{ ...CALLOUT_LABEL, color: RESULT_XP }}>
              {t("game.result.xpGained")}
            </div>
            <div style={{ ...CALLOUT_VALUE, color: RESULT_XP }}>
              {shownGained}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
