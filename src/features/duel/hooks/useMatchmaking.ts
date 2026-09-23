import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { matchmakingService } from "../lib/matchmaking";

/** Met le joueur en file d'attente et ouvre l'écran de recherche. */
export function useStartMatchmaking() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (topicId: string) => matchmakingService.enqueue(topicId),
    onSuccess: (response) => navigate(`/duel/search/${response.id}`),
  });
}

export function useCancelMatchmaking(ticketId: string) {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => matchmakingService.cancel(ticketId),
    onSuccess: () => navigate("/topics"),
  });
}
