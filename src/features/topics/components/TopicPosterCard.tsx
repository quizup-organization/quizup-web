import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryLabel } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics/domain/topic"
import { useTopicName } from "@/features/shell"

/**
 * Affiche verticale de sujet (Accueil, style « streaming ») : visuel 2:3 plein cadre, titre et
 * catégorie posés sur un dégradé sombre. Le rang optionnel (Top 10 des plus joués) est un
 * **chiffre de contour** placé derrière l'affiche, purement décoratif pour l'accessibilité.
 */
export function TopicPosterCard({
  topic,
  onOpen,
  rank,
  priority = false,
  className,
}: {
  topic: TopicCard
  onOpen: (topicId: string) => void
  /** Rang 1-based du classement (Top 10) — absent hors section classée. */
  rank?: number
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
  const rankLabel =
    rank === undefined ? null : t("topics.carousel.rank", { rank })

  return (
    <div className={cn("relative", className)}>
      {rank !== undefined && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-3 -left-14 z-0 font-heading leading-none font-black tracking-tighter text-transparent select-none",
            rank >= 10
              ? "text-6xl tablet-up:text-7xl"
              : "text-7xl tablet-up:text-8xl"
          )}
          style={{
            WebkitTextStroke:
              "2px color-mix(in oklab, var(--foreground) 42%, transparent)",
          }}
        >
          {rank}
        </span>
      )}
      <button
        type="button"
        data-slot="topic-card"
        aria-label={rankLabel ? `${rankLabel} — ${title}` : title}
        onClick={() => onOpen(topic.topicId)}
        className="group relative z-10 block w-full overflow-hidden rounded-card border border-border bg-card text-left transition-[border-color,transform] duration-200 hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <span className="relative block aspect-[2/3] overflow-hidden bg-muted">
          <TopicIcon
            topic={topic}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"
          />
          <span className="absolute inset-x-0 bottom-0 block p-3 tablet-up:p-3.5">
            {category && (
              <span className="block truncate text-2xs font-semibold tracking-wider text-white/75 uppercase">
                {category}
              </span>
            )}
            <span className="mt-1 line-clamp-2 block font-heading text-base leading-tight font-extrabold text-white tablet-up:text-lg">
              {title}
            </span>
          </span>
        </span>
      </button>
    </div>
  )
}
