import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getUserId } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { challengesService } from "@/lib/services/challenges";
import { gamesService } from "@/lib/services/games";

/**
 * Lance un run asynchrone depuis un défi : crée la partie (run solo, ou replay contre le
 * run adverse si `ghostGameId` est fourni), l'enregistre sur le défi, puis ouvre l'arène.
 */
export function useStartChallengeRun() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = getUserId();

  return useMutation({
    mutationFn: async (input: {
      challengeId: string;
      topicId: string;
      displayName: string;
      opponentId?: string;
      opponentName?: string;
      ghostGameId?: string;
    }) => {
      const game = await gamesService.createAsyncGame({
        topicId: input.topicId,
        playerId: userId as string,
        playerName: input.displayName,
        opponentId: input.opponentId,
        opponentName: input.opponentName,
        ghostGameId: input.ghostGameId,
      });
      await challengesService.registerRun(input.challengeId, game.id);
      return game;
    },
    onSuccess: (game) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.all });
      navigate(`/duel/${game.id}`);
    },
  });
}
