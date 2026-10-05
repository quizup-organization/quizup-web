import type { GameState } from "./game";

/**
 * Vue dérivée de la revanche pour l'écran de résultat. Toutes les règles sont pures :
 * le serveur reste l'autorité (le fold reflète ses notifications), la vue ne fait que
 * décider ce que l'UI peut proposer/afficher.
 */
export interface RematchView {
  /** Une demande de revanche est possible (partie humaine terminée, adversaire présent). */
  canRequest: boolean;
  /** Ma demande est en attente d'acceptation. */
  outgoingPending: boolean;
  /** L'adversaire a demandé la revanche (j'accepte ou je refuse). */
  incomingRequest: boolean;
  /** La revanche a été acceptée (au moins un joueur). */
  accepted: boolean;
  declined: boolean;
  cancelledReason: string | null;
  /** Partie de revanche créée : l'UI peut rediriger vers son arène. */
  newGameId: string | null;
  opponentPresent: boolean;
  opponentId: string | null;
}

/**
 * Dérive la vue de revanche d'une partie terminée.
 *
 * L'adversaire est « présent » quand il a rejoint l'arène après la fin (`joinedPlayerIds` est
 * purgé par `GAME_ENDED`, puis reconstruit par les `join` de l'écran de résultat).
 */
export function rematchView(
  game: GameState,
  userId: string,
  opponentId: string | null,
): RematchView {
  const opponentPresent =
    opponentId != null && game.joinedPlayerIds.includes(opponentId);
  const canRequest =
    game.status === "FINISHED" &&
    game.player2Type === "HUMAN" &&
    opponentPresent &&
    game.rematch.requesterId === null &&
    game.rematch.newGameId === null;

  return {
    canRequest,
    outgoingPending: game.rematch.requesterId === userId,
    incomingRequest:
      game.rematch.requesterId !== null && game.rematch.requesterId !== userId,
    accepted: game.rematch.acceptedIds.length > 0,
    declined: game.rematch.declined,
    cancelledReason: game.rematch.cancelledReason,
    newGameId: game.rematch.newGameId,
    opponentPresent,
    opponentId,
  };
}
