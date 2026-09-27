import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { gamesService } from "../lib/games";
import type { BotDifficulty, GameChoice } from "../domain/game-dto";

/**
 * Réponse du joueur à la question courante. L'état de la partie n'est pas lu ici : il est
 * reconstruit par le read model `GameState` (fold des notifications REST + WebSocket).
 */
export function useAnswerQuestion(gameId: string) {
  return useMutation({
    mutationFn: (choice: GameChoice) => gamesService.answer(gameId, choice),
  });
}

/** Crée une partie contre un bot et redirige vers l'arène. */
export function useStartDuel() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (input: { topicId: string; difficulty: BotDifficulty }) =>
      gamesService.create({
        topicId: input.topicId,
        mode: "BOT",
        difficulty: input.difficulty,
      }),
    onSuccess: (response) => navigate(`/duel/${response.id}`),
  });
}
