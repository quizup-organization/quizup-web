import { gamesService } from "../lib/games";
import type { GameNotification } from "@/shared/types/notifications";
import { applyGameNotification, emptyGame, type GameState } from "../domain/game";
import { NotificationStream } from "./notification-stream";

/** Stream d'une partie : historique REST + push STOMP `/topic/games/{gameId}`. */
export function createGameStream(
  gameId: string,
): NotificationStream<GameNotification, GameState> {
  return new NotificationStream<GameNotification, GameState>({
    service: "game",
    aggregateId: gameId,
    topic: `/topic/games/${gameId}`,
    initial: emptyGame,
    load: (id) => gamesService.getNotifications(id),
    apply: applyGameNotification,
  });
}
