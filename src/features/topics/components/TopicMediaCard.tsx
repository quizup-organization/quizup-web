import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryLabel } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics/domain/topic"
import { useTopicName } from "@/features/shell"

/** Format d'une affiche d'accueil : portrait du Top 10 ou paysage des autres sections. */
export type TopicMediaFormat = "poster" | "landscape"

/**
 * Affiche de sujet de l'Accueil (style FranceTV) : visuel plein cadre et aucun liseré au repos.
 * Le format `poster` (Top 10) est **responsive** : en compact la carte complète (affiche + pied
 * titre/catégorie) est exactement 3:5 ; à partir de la tablette l'affiche seule est 2:3 et le
 * titre/catégorie passent sous l'affiche, sur le fond de page. `landscape` reste une carte 16:9
 * avec pied intégré pour les autres sections.
 * Le rang optionnel est un chiffre de contour proportionnel à la carte, placé derrière l'affiche
 * portrait, que la carte chevauche légèrement.
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
  /** `poster` : carte 3:5 compact / affiche 2:3 du Top 10 ; `landscape` : carte 16:9 des autres rails. */
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
          className={cn(
            "pointer-events-none absolute -top-2 -left-12 z-0 font-heading leading-none font-light tracking-tighter text-transparent select-none tablet-up:-left-14",
            rankValue >= 10 ? "text-[50cqw]" : "text-[68cqw]"
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
          "group relative z-10 block w-full text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
          isPoster
            ? "compact:flex compact:aspect-[3/5] compact:flex-col compact:overflow-hidden compact:rounded-lg compact:bg-card tablet-up:bg-transparent"
            : "overflow-hidden rounded-lg bg-card"
        )}
      >
        <span
          data-slot="topic-card-media"
          className={cn(
            "relative block overflow-hidden bg-muted",
            isPoster
              ? "compact:min-h-0 compact:flex-1 tablet-up:aspect-[2/3] tablet-up:rounded-lg"
              : "aspect-video"
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
            "flex flex-col",
            category ? "justify-between" : "justify-center",
            isPoster
              ? "compact:h-20 compact:shrink-0 compact:bg-muted compact:px-3 compact:py-2.5 tablet-up:min-h-10 tablet-up:bg-transparent tablet-up:px-3 tablet-up:pt-2 tablet-up:pb-0"
              : "h-16 bg-muted px-3 py-2.5"
          )}
        >
          <span
            className={cn(
              "block truncate font-heading text-base leading-tight font-bold text-foreground",
              isPoster && "tablet-up:text-sm"
            )}
          >
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
