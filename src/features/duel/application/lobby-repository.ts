import { lobbiesService } from "@/lib/services/lobbies";
import type { LobbyNotification } from "@/shared/types/notifications";
import { applyLobbyNotification, emptyLobby, type Lobby } from "../domain/lobby";
import { NotificationStream } from "./notification-stream";

/** Stream d'un lobby : historique REST + push STOMP `/topic/lobbies/{lobbyId}`. */
export function createLobbyStream(
  lobbyId: string,
): NotificationStream<LobbyNotification, Lobby> {
  return new NotificationStream<LobbyNotification, Lobby>({
    service: "matchmaking",
    aggregateId: lobbyId,
    topic: `/topic/lobbies/${lobbyId}`,
    initial: emptyLobby,
    load: (id) => lobbiesService.getNotifications(id),
    apply: applyLobbyNotification,
  });
}
