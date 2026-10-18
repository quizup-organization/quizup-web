import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryLabel } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics/domain/topic"
import { useTopicName } from "@/features/shell"

/** Format d'une affiche d'accueil : portrait du Top 10 ou paysage des autres sections. */
export type TopicMediaFormat = "poster" | "landscape"

/**
 * Affiche de sujet de l'Accueil (style FranceTV) : visuel plein cadre, **pied de carte intégré**
 * (titre + catégorie sur `bg-muted`), bordure de surface et aucun liseré décoratif. Le format
 * `poster` (Top 10) est une carte **3:5 à toutes les tailles** (affiche + pied) ; `landscape`
 * reste une carte 16:9 avec pied intégré pour les autres sections.
 * Le rang optionnel est un chiffre de contour proportionnel à la carte, placé derrière l'affiche
 * portrait, que la carte chevauche légèrement. Les rangs 1 → 10 ont la même taille de chiffre.
 */
export function TopicMediaCard({
  topic,
  onOpen,
  rank,
  format = "landscape",
  priority = false,
  className,
}: {
  topic: TopicCard
  onOpen: (topicId: string) => void
  /** Rang 1-based du classement (Top 10) — affiché uniquement en format `poster`. */
  rank?: number
  /** `poster` : carte 3:5 du Top 10 ; `landscape` : carte 16:9 des autres rails. */
  format?: TopicMediaFormat
  /** Visuel au-dessus de la ligne de flottaison (`eager` + priorité haute). */
  priority?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const title = resolveName(topic.names)
  const category = topic.category
    ? categoryLabel(topic.category, topic.categoryLabel ?? undefined)
    : null
  const rankValue = format === "poster" ? rank : undefined
  const rankLabel =
    rankValue === undefined
      ? null
      : t("topics.carousel.rank", { rank: rankValue })
  const visualUrl =
    format === "landscape"
      ? (topic.bannerUrl ?? topic.imageUrl)
      : topic.imageUrl
  const visualTopic = { ...topic, imageUrl: visualUrl }
  const isPoster = format === "poster"

  return (
    <div className={cn("@container relative", className)}>
      {rankValue !== undefined && (
        <span
          aria-hidden
          data-slot="topic-rank"
          className={cn(
            "pointer-events-none absolute -top-2 z-0 font-heading text-[68cqw] leading-none font-light text-transparent select-none",
            rankValue >= 10
              ? "-left-20 tracking-[-0.12em] tablet-up:-left-24"
              : "-left-12 tracking-tighter tablet-up:-left-14"
          )}
          style={{
            WebkitTextStroke:
              "2px color-mix(in oklab, var(--foreground) 88%, transparent)",
          }}
        >
          {rankValue}
        </span>
      )}
      <button
        type="button"
        data-slot="topic-card"
        data-format={format}
        aria-label={rankLabel ? `${rankLabel} — ${title}` : title}
        onClick={() => onOpen(topic.topicId)}
        className={cn(
          "group relative z-10 block w-full overflow-hidden rounded-lg border border-border bg-card text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
          isPoster && "flex aspect-[3/5] flex-col"
        )}
      >
        <span
          data-slot="topic-card-media"
          className={cn(
            "relative block overflow-hidden bg-muted",
            isPoster ? "min-h-0 flex-1" : "aspect-video"
          )}
        >
          <TopicIcon
            topic={visualTopic}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        </span>
        <span
          data-slot="topic-card-footer"
          className={cn(
            "flex flex-col bg-muted px-3 py-2.5",
            category ? "justify-between" : "justify-center",
            isPoster ? "h-20 shrink-0" : "h-16"
          )}
        >
          <span className="block truncate font-heading text-base leading-tight font-bold text-foreground">
            {title}
          </span>
          {category && (
            <span className="block truncate text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
              {category}
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
