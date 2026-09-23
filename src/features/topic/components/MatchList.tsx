import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { queryKeys } from "@/lib/query-keys";
import { topicsService, toTopicView } from "@/features/topics";
import { personColor } from "@/features/people";
import { getSessionUserId as getUserId } from "@/features/auth";
import type { Game } from "@/features/duel/domain/game-dto";

/** Liste de duels — barre d'accent, sujet, adversaire, score (profil / fiche sujet).
 *  Chaque carte ouvre la page du duel (résultat si la partie est terminée). */
export function MatchList({ games }: { games: Game[] }) {
  const userId = getUserId();
  const topicIds = [...new Set(games.map((game) => game.topicId))];
  const topicQueries = useQueries({
    queries: topicIds.map((topicId) => ({
      queryKey: queryKeys.topics.detail(topicId),
      queryFn: () => topicsService.getById(topicId),
      staleTime: 10 * 60 * 1000,
    })),
  });
  const topicById = new Map(
    topicIds.map((topicId, index) => {
      const dto = topicQueries[index]?.data;
      return [topicId, dto ? toTopicView(dto) : undefined];
    }),
  );

  return (
    <div className="flex flex-col gap-2.5">
      {games.map((game) => {
        const isPlayer1 = game.player1Id === userId;
        const me = isPlayer1 ? game.player1Score : game.player2Score;
        const them = isPlayer1 ? game.player2Score : game.player1Score;
        const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
        const opponentName =
          (isPlayer1 ? game.player2Name : game.player1Name) ?? "Adversaire";
        const win = game.winnerId === userId;
        const draw = game.winnerId == null;
        const accent = draw
          ? "var(--duel-score)"
          : win
            ? "var(--duel-correct-accent)"
            : "var(--duel-wrong-accent)";
        const topic = topicById.get(game.topicId);
        const when = new Date(game.createdAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Link
            key={game.gameId}
            to={`/duel/${game.gameId}`}
            aria-label={`Voir le résultat du duel contre ${opponentName}`}
            className="block rounded-4xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card
              size="sm"
              className="cursor-pointer gap-0 py-3 transition-colors hover:bg-muted/40 sm:py-4"
            >
              <CardContent className="flex items-center gap-3 px-3 sm:gap-4 sm:px-4">
                <div
                  className="h-10 w-[3px] shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                {topic && <TopicIcon topic={topic} size={38} />}

                <div className="min-w-0 flex-1 sm:w-[170px] sm:flex-none">
                  <div className="truncate text-sm font-semibold">
                    {topic?.name ?? "Sujet"}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{when}</div>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                    <UserAvatar
                      name={opponentName}
                      color={opponentId ? personColor(opponentId) : undefined}
                      size={18}
                    />
                    <span className="truncate">contre {opponentName}</span>
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 items-center gap-2.5 sm:flex">
                  <UserAvatar
                    name={opponentName}
                    color={opponentId ? personColor(opponentId) : undefined}
                    size={28}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    contre {opponentName}
                  </span>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-1 font-heading text-base font-bold">
                    <span className="text-[var(--duel-score)]">{me}</span>
                    <span className="text-xs text-muted-foreground">—</span>
                    <span className="text-muted-foreground">{them}</span>
                  </div>
                  <div
                    className="text-xs font-semibold sm:w-[82px] sm:text-right"
                    style={{ color: accent }}
                  >
                    {draw ? "Égalité" : win ? "Victoire" : "Défaite"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
