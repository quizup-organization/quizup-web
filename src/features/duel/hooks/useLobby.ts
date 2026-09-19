import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createLobbyStream } from "../application/lobby-repository";
import { emptyLobby, type Lobby } from "../domain/lobby";

interface UseLobbyResult {
  lobby: Lobby;
  isLoading: boolean;
  isError: boolean;
}

/**
 * État d'un lobby, reconstruit par fold des notifications (historique REST + WebSocket).
 * Remplace le polling du ticket : aucun `refetchInterval`.
 */
export function useLobby(lobbyId: string): UseLobbyResult {
  const stream = useMemo(() => createLobbyStream(lobbyId), [lobbyId]);
  const fallback = useMemo(() => emptyLobby(lobbyId), [lobbyId]);

  useEffect(() => {
    stream.start();
    return () => stream.stop();
  }, [stream]);

  const lobby =
    useSyncExternalStore(
      stream.subscribe,
      stream.getSnapshot,
      stream.getSnapshot,
    ) ?? fallback;

  return {
    lobby,
    isLoading: !stream.isLoaded() && !stream.hasLoadError(),
    isError: stream.hasLoadError(),
  };
}
