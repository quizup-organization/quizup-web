/** Message de partage d'un salon (les intents réseaux vivent dans `shared/utils/share`). */
export function shareMessage(topicName?: string): string {
  return `Rejoins mon duel QuizUp${topicName ? ` sur « ${topicName} »` : ""} !`
}
