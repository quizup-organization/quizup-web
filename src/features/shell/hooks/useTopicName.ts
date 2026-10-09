import { useCallback } from "react";
import { topicName, type TopicNames } from "@/features/topics/domain/topic";
import { useMe } from "./useMe";

/**
 * Résout le nom d'un sujet dans la langue du joueur courant (`me.language`, repli `fr`).
 * À utiliser partout où l'API expose désormais `names` (Map) plutôt qu'un `name` unique.
 */
export function useTopicName() {
  const { data: me } = useMe();
  const language = me?.language ?? "fr";
  return useCallback(
    (names: TopicNames | null | undefined, fallback = "Sujet") =>
      topicName(names, language, fallback),
    [language],
  );
}
