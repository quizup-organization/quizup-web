import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import type { GameHistoryItem } from "@/features/player/domain/history";

const OUTCOME_LABEL: Record<GameHistoryItem["outcome"], string> = {
  WIN: "Victoire",
  LOSS: "Défaite",
  DRAW: "Égalité",
  WAITING: "En attente",
  IN_PROGRESS: "En cours",
  CANCELLED: "Annulé",
};

const OUTCOME_COLOR: Record<GameHistoryItem["outcome"], string> = {
  WIN: "var(--duel-correct-accent)",
  LOSS: "var(--duel-wrong-accent)",
  DRAW: "var(--duel-score)",
  WAITING: "var(--duel-score)",
  IN_PROGRESS: "var(--duel-score)",
  CANCELLED: "var(--duel-score)",
};

function opponentName(item: GameHistoryItem): string {
  if (item.opponent?.pseudonym) return item.opponent.pseudonym;
  return item.opponentType === "BOT" ? "Bot" : "Adversaire";
}

/** Liste de duels — barre d'accent, sujet, adversaire, score, XP réel (profil / fiche sujet).
 *  Chaque carte ouvre la page du duel (résultat si la partie est terminée). */
export function MatchList({ items }: { items: GameHistoryItem[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const name = opponentName(item);
        const accent = OUTCOME_COLOR[item.outcome];
        const when = new Date(item.playedAt).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <Link
            key={item.gameId}
            to={`/duel/${item.gameId}`}
            aria-label={`Voir le résultat du duel contre ${name}`}
            className="block rounded-4xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card
              size="sm"
              className="cursor-pointer gap-0 py-3 transition-[color,box-shadow] hover:ring-foreground/25 sm:py-4"
            >
              <CardContent className="flex items-center gap-3 px-3 sm:gap-4 sm:px-4">
                <div
                  className="h-10 w-[3px] shrink-0 rounded-full"
                  style={{ background: accent }}
                />
                <TopicIcon topic={item.topic} size={38} />

                <div className="min-w-0 flex-1 sm:w-[170px] sm:flex-none">
                  <div className="truncate text-sm font-semibold">
                    {item.topic.name}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{when}</div>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
                    <UserAvatar
                      name={name}
                      userId={item.opponent?.userId}
                      avatarOptions={item.opponent?.avatarOptions ?? undefined}
                      size={18}
                    />
                    <span className="truncate">contre {name}</span>
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 items-center gap-2.5 sm:flex">
                  <UserAvatar
                    name={name}
                    userId={item.opponent?.userId}
                    avatarOptions={item.opponent?.avatarOptions ?? undefined}
                    size={28}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    contre {name}
                  </span>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex items-center gap-1 font-heading text-base font-bold">
                    <span className="text-[var(--duel-score)]">{item.myScore}</span>
                    <span className="text-xs text-muted-foreground">—</span>
                    <span className="text-muted-foreground">
                      {item.opponentScore}
                    </span>
                  </div>
                  <div
                    className="text-xs font-semibold sm:w-[82px] sm:text-right"
                    style={{ color: accent }}
                  >
                    {OUTCOME_LABEL[item.outcome] ?? "—"}
                  </div>
                  {item.xp != null && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      ＋{item.xp} XP
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
