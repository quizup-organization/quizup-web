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
  lineHeight: 1.2,
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
 * Encombrement horizontal du tracé pointé (trait + pastille + gouttière), en fraction de
 * l'anneau : largeur du tracé (0,16) + deux rayons de pastille (0,035) + gouttière (0,035).
 * Sert à borner la largeur du texte d'un callout pour qu'il ne sorte jamais de l'écran.
 */
const CALLOUT_POINTER = 0.16 + 0.035 + 0.035

/**
 * Anneau de niveau de l'écran de résultat (maquette `img_6`) : piste blanche, segment corail de
 * l'**XP gagnée sur ce duel**, segment blanc de l'**XP restante avant le niveau suivant** — les
 * deux callouts chiffrés sont les deux segments de l'anneau (corail pointé au milieu de son arc
 * en haut à droite, reste pointé au milieu du blanc en bas à gauche, pastille côté texte).
 * Le rouge du segment est dérivé du bouton Rejouer (`RESULT_XP`). Le donut **entre** dès que la
 * récompense est projetée — animation d'ouverture de page (`qu-pop`), puis remplissage de l'arc
 * et **deux compteurs solidaires** sur la même horloge (`useRingReveal`, une fois par affichage) :
 * « XP gagnée » monte de 0 à sa valeur, « reste avant le niveau suivant » **décompte** du restant
 * d'avant le duel (`restant + gagnée`) à celui d'après (la somme des deux callouts reste donc
 * égale au total de l'anneau). C'est **dès l'entrée dans la page résultat** quand la récompense
 * y est déjà (cas courant). Tant qu'elle n'est pas projetée il n'y a **aucun état transitoire** :
 * la place est réservée, le composant invisible (jamais de `···`, jamais d'anneau vide).
 * <p>
 * Les deux callouts sont ancrés au conteneur **pleine largeur** (celui de la pile, borné à
 * 520 px) et leur texte est plafonné (`maxWidth`) : les libellés ne débordent **jamais** de
 * l'écran, quel que soit le device ou la longueur du libellé.
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
  // Décompte solidaire de la montée de l'arc : le blanc part du restant d'avant le duel
  // (`total = gagnée + restant`) et descend jusqu'au restant d'après (`total - gagnée`).
  const shownRemaining = total - shownGained

  // Tracés pointés au **milieu** de leur segment (maquette) : corail à 1,8°·p (36° pour 20 %),
  // blanc à l'opposé (216° pour 20 %). La hauteur suit le cosinus, l'ancre X la projection sur le
  // bord extérieur de l'anneau (rayon = 50 % de la boîte). Les deux positions sont **bornées à
  // celles de la maquette** (36° / 216°) : plus près du sommet ou du bas, le texte des callouts
  // passerait sous la bande blanche (gain faible ou nul). L'ancrage horizontal se fait sur le
  // **conteneur pleine largeur** (décalage en multiple de l'anneau) et `maxWidth` plafonne chaque
  // texte à la place réellement disponible : aucun callout ne peut dépasser l'écran.
  const coralMid = Math.max(36, 1.8 * fill) * RAD
  const whiteMid = Math.max(216, 180 + 1.8 * fill) * RAD
  const coralTop = `${(1 - Math.cos(coralMid)) * 50}%`
  const whiteTop = `${(1 - Math.cos(whiteMid)) * 50}%`
  const coralEdge = 0.5 * Math.sin(coralMid)
  const whiteEdge = -0.5 * Math.sin(whiteMid)
  const coralLeft = `calc(50% + ${RING_SIZE} * ${coralEdge.toFixed(4)})`
  const whiteRight = `calc(50% + ${RING_SIZE} * ${whiteEdge.toFixed(4)})`
  const coralTextMax = `calc(50% - ${RING_SIZE} * ${(coralEdge + CALLOUT_POINTER).toFixed(4)})`
  const whiteTextMax = `calc(50% - ${RING_SIZE} * ${(whiteEdge + CALLOUT_POINTER).toFixed(4)})`

  return (
    <div
      className={`relative flex w-full items-center justify-center ${
        revealed ? "qu-pop" : ""
      }`}
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
            maxWidth: whiteTextMax,
          }}
        >
          <div style={{ ...CALLOUT_LABEL, color: RESULT_WHITE }}>
            {t("game.result.xpForLevel", { level: level + 1 })}
          </div>
          <div style={{ ...CALLOUT_VALUE, color: RESULT_WHITE }}>
            {shownRemaining}
          </div>
        </div>
        <div style={{ ...DOT, background: RESULT_WHITE }} />
        <div style={{ ...LINE, background: RESULT_WHITE }} />
      </div>

      <div
        className="relative shrink-0"
        style={{ width: RING_SIZE, height: RING_SIZE }}
      >
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
            maxWidth: coralTextMax,
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
  )
}
