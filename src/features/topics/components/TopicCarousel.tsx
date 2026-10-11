import type { TopicCard } from "@/features/topics/domain/topic";
import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area";
import { TopicListCard } from "./TopicListCard";

/**
 * Bandeau horizontal de sujets — cartes minimalistes, scroll natif géré par l'Arc `ScrollArea`
 * (barre fine en surimpression + fondus d'extrémité, molette verticale → horizontal sur desktop).
 */
export function TopicCarousel({
  topics,
  onOpen,
  label,
}: {
  topics: TopicCard[];
  onOpen: (topicId: string) => void;
  /** Nom accessible du bandeau (une région par carrousel sur l'accueil). */
  label?: string;
}) {
  const { t } = useTranslation();
  return (
    <ScrollArea
      orientation="horizontal"
      label={label ?? t("topics.carousel.region")}
      viewportClassName="flex gap-3 pb-3"
    >
      {topics.map((topic) => (
        <div key={topic.topicId} className="w-40 shrink-0 tablet:w-44 desktop:w-48">
          <TopicListCard topic={topic} onOpen={onOpen} />
        </div>
      ))}
    </ScrollArea>
  );
}
