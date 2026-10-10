import { TopicIcon } from "@/shared/components/topic-icon";
import { categoryLabel } from "@/shared/utils/categories";
import type { TopicCard } from "@/features/topics/domain/topic";
import { useTopicName } from "@/features/shell";
import { SelectRow } from "./SelectRow";

interface ThemeSelectRowProps {
  topic: TopicCard;
  selected?: boolean;
  /** Fourni ⇒ ligne interactive (bouton + radio) ; absent ⇒ ligne statique. */
  onSelect?: () => void;
}

/**
 * Ligne de sélection de thème — même anatomie neutre que la sélection de joueur
 * (`SelectRow`) : pastille du sujet, nom, catégorie, radio.
 */
export function ThemeSelectRow({ topic, selected, onSelect }: ThemeSelectRowProps) {
  const resolveName = useTopicName();
  return (
    <SelectRow
      visual={<TopicIcon topic={topic} size={34} className="rounded-xl" />}
      title={resolveName(topic.names)}
      subtitle={categoryLabel(topic.category ?? "", topic.categoryLabel ?? undefined)}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
