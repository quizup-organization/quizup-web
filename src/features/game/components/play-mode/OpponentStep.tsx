import { useTranslation } from "react-i18next"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryColor, categoryLabel } from "@/shared/utils/categories"
import { useTopicName } from "@/features/shell"
import type { TopicCard } from "@/features/topics/domain/topic"
import { ChoiceCard } from "./ChoiceCard"
import { OPPONENT_CHOICES, type Opponent } from "./options"

interface OpponentStepProps {
  topic: TopicCard
  selected: Opponent
  onSelect: (opponent: Opponent) => void
}

/** Étape 1 : rappel du sujet puis choix de l'adversaire (monde / joueur / bot / salon privé). */
export function OpponentStep({ topic, selected, onSelect }: OpponentStepProps) {
  const { t } = useTranslation()
  const resolveName = useTopicName()

  return (
    <>
      <div
        className="mb-4 flex shrink-0 items-center gap-3.5 rounded-2xl border p-3.5"
        style={{
          borderColor: `color-mix(in srgb, ${topic.color ?? "var(--primary)"} 30%, var(--border))`,
          background: `linear-gradient(120deg, color-mix(in srgb, ${topic.color ?? "var(--primary)"} 16%, transparent), transparent 65%)`,
        }}
      >
        <TopicIcon
          topic={topic}
          size={46}
          className="rounded-[16px] shadow-lg"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-sm font-extrabold tracking-tight">
            {resolveName(topic.names)}
          </div>
          <div
            className="mt-0.5 truncate text-2xs font-semibold tracking-[0.14em] uppercase"
            style={{
              color: topic.color ?? categoryColor(topic.category ?? ""),
            }}
          >
            {categoryLabel(
              topic.category ?? "",
              topic.categoryLabel ?? undefined
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="font-heading text-sm font-bold">
          {t("game.playMode.whoTitle")}
        </div>
        {OPPONENT_CHOICES.map((choice) => (
          <ChoiceCard
            key={choice.id}
            icon={choice.icon}
            title={t(choice.titleKey)}
            desc={t(choice.descKey)}
            selected={selected === choice.id}
            onSelect={() => onSelect(choice.id)}
          />
        ))}
      </div>
    </>
  )
}
