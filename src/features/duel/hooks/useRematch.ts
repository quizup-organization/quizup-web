import { useMutation } from "@tanstack/react-query";
import { gamesService } from "../lib/games";

/**
 * Actions de revanche de l'écran de résultat (partie humaine terminée).
 *
 * Chaque action est une mutation indépendante exposant son propre `isPending` : l'UI peut
 * désactiver le bouton concerné sans bloquer les autres. L'état faisant foi (demande,
 * acceptation, refus, nouvelle partie) arrive par le flux STOMP de la partie — ces mutations
 * ne patchent pas le cache ; les erreurs éventuelles remontent au bus d'erreurs global
 * (toast), comme les autres mutations de duel.
 */
export function useRematch(gameId: string) {
  const request = useMutation({
    mutationFn: () => gamesService.requestRematch(gameId),
  });
  const accept = useMutation({
    mutationFn: () => gamesService.acceptRematch(gameId),
  });
  const decline = useMutation({
    mutationFn: () => gamesService.declineRematch(gameId),
  });
  const cancel = useMutation({
    mutationFn: () => gamesService.cancelRematch(gameId),
  });

  return {
    request,
    accept,
    decline,
    cancel,
    requestPending: request.isPending,
    acceptPending: accept.isPending,
    declinePending: decline.isPending,
    cancelPending: cancel.isPending,
  };
}
