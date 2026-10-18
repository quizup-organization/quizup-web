import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryLabel } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics/domain/topic"
import { useTopicName } from "@/features/shell"

/** Format d'une affiche d'accueil : portrait du Top 10 ou paysage des autres sections. */
export type TopicMediaFormat = "poster" | "landscape"

/**
 * Affiche de sujet de l'Accueil (style FranceTV) : visuel plein cadre, **pied de carte séparé**
 * (titre + catégorie sur `bg-muted`) et aucun liseré au repos. Le format `poster` est une affiche
 * 3:5 réservée au Top 10 ; `landscape` est une carte 16:9 pour les autres sections.
 * Le rang optionnel est un chiffre de contour placé derrière l'affiche portrait, que la carte
 * chevauche légèrement.
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
  /** `poster` : affiche 3:5 du Top 10 ; `landscape` : carte 16:9 des autres rails. */
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

  return (
    <div className={cn("relative", className)}>
      {rankValue !== undefined && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-6 z-0 font-heading leading-none font-black tracking-tighter text-transparent select-none",
            rankValue >= 10 ? "-left-8 text-6xl" : "-left-7 text-8xl"
          )}
          style={{
            WebkitTextStroke:
              "2px color-mix(in oklab, var(--foreground) 78%, transparent)",
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
        className="group relative z-10 block w-full overflow-hidden rounded-lg bg-card text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <span
          className={cn(
            "relative block overflow-hidden bg-muted",
            format === "poster" ? "aspect-[3/5]" : "aspect-video"
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
          className={cn(
            "flex h-16 flex-col bg-muted px-3 py-2.5",
            category ? "justify-between" : "justify-center"
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
