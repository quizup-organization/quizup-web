import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { queryKeys } from "@/lib/query-keys";
import { gamesService } from "@/features/duel";
import { challengesService } from "../lib/challenges";

/**
 * Lance un run asynchrone depuis un défi : crée la partie (run solo, ou replay contre le
 * run adverse si `opponentId` + `ghostGameId` sont fournis), l'enregistre sur le défi,
 * puis ouvre l'arène.
 */
export function useStartChallengeRun() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      challengeId: string;
      topicId: string;
      opponentId?: string;
      ghostGameId?: string;
    }) => {
      const game = await gamesService.create({
        topicId: input.topicId,
        mode: "ASYNC",
        opponentId: input.opponentId,
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
