import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createGameStream } from "../application/game-repository";
import { emptyGame, type GameState } from "../domain/game";

interface UseGameStateResult {
  game: GameState;
  isLoading: boolean;
  isError: boolean;
}

/**
 * État d'une partie, reconstruit par fold des notifications (historique REST + WebSocket).
 * Remplace le polling de la projection : aucun `refetchInterval`.
 */
export function useGameState(gameId: string): UseGameStateResult {
  const stream = useMemo(() => createGameStream(gameId), [gameId]);
  const fallback = useMemo(() => emptyGame(gameId), [gameId]);

  useEffect(() => {
    stream.start();
    return () => stream.stop();
  }, [stream]);

  const game =
    useSyncExternalStore(
      stream.subscribe,
      stream.getSnapshot,
      stream.getSnapshot,
    ) ?? fallback;

  return {
    game,
    isLoading: !stream.isLoaded() && !stream.hasLoadError(),
    isError: stream.hasLoadError(),
  };
}
