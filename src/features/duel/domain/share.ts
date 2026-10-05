/** Message de partage d'un salon (les intents réseaux vivent dans `shared/utils/share`). */
export function shareMessage(topicName?: string): string {
  return `Rejoins mon duel QuizUp${topicName ? ` sur « ${topicName} »` : ""} !`;
}

/** Message de partage du résultat d'un duel (ex. « J'ai gagné 114 à 87 sur Cinéma… »). */
export function resultShareMessage(
  outcome: "win" | "loss" | "draw",
  myScore: number,
  opponentScore: number,
  topicName?: string,
): string {
  const topic = topicName ? ` sur ${topicName}` : "";
  if (outcome === "win") {
    return `J'ai gagné ${myScore} à ${opponentScore}${topic} — tente de me battre !`;
  }
  if (outcome === "loss") {
    return `J'ai perdu ${myScore} à ${opponentScore}${topic} — à toi de jouer !`;
  }
  return `Match nul ${myScore} à ${opponentScore}${topic} — viens me départager !`;
}

/** Message de partage d'une question de la revue (texte + sujet). */
export function questionShareMessage(
  questionText: string,
  topicName?: string,
): string {
  return `${questionText} — viens jouer${topicName ? ` à « ${topicName} »` : ""} sur QuizUp !`;
}
