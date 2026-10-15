import {
  DONUT_CIRCUMFERENCE,
  DONUT_R_INNER,
  DONUT_R_MID,
  DONUT_R_OUTER,
  type TopicsPlayedChart,
} from "../domain/topics-played-chart"

interface TopicsPlayedDonutProps {
  chart: TopicsPlayedChart
  ariaLabel: string
}

/** Taille (unités) des compteurs au centre des parts, proportionnelle à l'anneau. */
const COUNT_FONT = 4.8

/**
 * Donut « Sujets joués » (maquette `img_9`) : anneau de parts colorées, **compteur au centre de
 * chaque part**, et libellés extérieurs reliés par une pastille + un tracé pointé. Le plan
 * (parts, compteurs, ancres) est calculé par `buildTopicsPlayedChart` ; ce composant ne fait que
 * le rendre, à l'échelle de la boîte (viewBox 100 × 100 ↔ carré fluide).
 */
export function TopicsPlayedDonut({
  chart,
  ariaLabel,
}: TopicsPlayedDonutProps) {
  const { segments } = chart

  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[420px]"
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        {segments.map((segment) => (
          <circle
            key={`arc-${segment.key}`}
            cx={50}
            cy={50}
            r={DONUT_R_MID}
            fill="none"
            stroke={segment.color}
            strokeWidth={DONUT_R_OUTER - DONUT_R_INNER}
            strokeDasharray={`${segment.arcLength} ${
              DONUT_CIRCUMFERENCE - segment.arcLength
            }`}
            strokeDashoffset={segment.arcOffset}
            transform="rotate(-90 50 50)"
          />
        ))}
        {segments.map((segment) => (
          <text
            key={`value-${segment.key}`}
            x={segment.countX}
            y={segment.countY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={COUNT_FONT}
            fontWeight={800}
            fill="#ffffff"
          >
            {segment.value}
          </text>
        ))}
        {segments.map((segment) => (
          <g key={`leader-${segment.key}`}>
            <line
              x1={segment.dotX}
              y1={segment.dotY}
              x2={segment.lineX}
              y2={segment.lineY}
              stroke={segment.color}
              strokeWidth={1}
            />
            <circle
              cx={segment.dotX}
              cy={segment.dotY}
              r={1.2}
              fill={segment.color}
            />
          </g>
        ))}
      </svg>

      {segments.map((segment) => (
        <div
          key={`label-${segment.key}`}
          className="absolute text-2xs leading-tight font-semibold text-foreground"
          style={{
            top: `${segment.labelY}%`,
            left: `${segment.labelX}%`,
            maxWidth: `${segment.labelMaxWidth}%`,
            textAlign: segment.labelAlign,
            transform:
              segment.labelAlign === "right"
                ? "translate(-100%, -50%)"
                : segment.labelAlign === "left"
                  ? "translateY(-50%)"
                  : "translate(-50%, -50%)",
            overflowWrap: "break-word",
          }}
        >
          {segment.label}
        </div>
      ))}
    </div>
  )
}
