import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getSessionUserId as getUserId } from "@/features/auth";
import { gamesService } from "@/lib/services/games";
import type { BotDifficulty } from "@/shared/types/api";
import type { GameChoice } from "@/shared/types/domain";

/**
 * Réponse du joueur à la question courante. L'état de la partie n'est plus lu ici : il est
 * reconstruit par le read model `GameState` (fold des notifications REST + WebSocket).
 */
export function useAnswerQuestion(gameId: string) {
  const userId = getUserId();
  return useMutation({
    mutationFn: (choice: GameChoice) =>
      gamesService.answer(gameId, userId as string, choice),
  });
}

/** Crée une partie contre un bot et redirige vers l'arène. */
export function useStartDuel() {
  const navigate = useNavigate();
  const userId = getUserId();
  return useMutation({
    mutationFn: (input: {
      topicId: string;
      playerName: string;
      difficulty: BotDifficulty;
    }) =>
      gamesService.createBotGame({
        topicId: input.topicId,
        playerId: userId as string,
        playerName: input.playerName,
        difficulty: input.difficulty,
      }),
    onSuccess: (response) => navigate(`/duel/${response.id}`),
  });
}
