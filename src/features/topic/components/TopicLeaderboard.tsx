import { useState } from "react";
import { Crown, Globe, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { UserAvatar } from "@/components/user-avatar";
import { veil } from "@/theme/tokens";
import { getUserId } from "@/lib/auth";
import type { LeaderboardPeriod, LeaderboardScope } from "@/lib/services/leaderboard";
import { useTopicLeaderboard } from "../hooks/useTopicDetail";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "all-time", label: "Général" },
  { value: "monthly", label: "Mensuel" },
];

const SCOPES: { value: LeaderboardScope; label: string; icon: typeof Globe }[] = [
  { value: "world", label: "Monde", icon: Globe },
  { value: "following", label: "Abonnés", icon: Users },
  { value: "country", label: "Pays", icon: MapPin },
];

/** Classement d'un sujet — données réelles du service leaderboard. */
export function TopicLeaderboard({ topicId }: { topicId: string }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const [scope, setScope] = useState<LeaderboardScope>("world");
  const userId = getUserId();
  const { data: rows = [], isLoading, isError } = useTopicLeaderboard(topicId, period, scope);

  const scopeLabel = SCOPES.find((s) => s.value === scope)?.label ?? "Monde";
  const periodLabel = period === "monthly" ? "ce mois-ci" : "de tous les temps";

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-[45px] z-10 flex flex-wrap items-center gap-2.5 bg-background py-1.5">
        <div className="flex items-center gap-1.5">
          {PERIODS.map((p) => (
            <Toggle
              key={p.value}
              variant="outline"
              size="sm"
              pressed={period === p.value}
              onPressedChange={() => setPeriod(p.value)}
            >
              {p.label}
            </Toggle>
          ))}
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          {SCOPES.map((s) => (
            <Toggle
              key={s.value}
              variant="outline"
              size="sm"
              pressed={scope === s.value}
              onPressedChange={() => setScope(s.value)}
            >
              <s.icon /> {s.label}
            </Toggle>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">
          {scopeLabel} · {periodLabel}
        </span>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex items-center border-b px-4 py-3 text-[11px] font-semibold text-muted-foreground">
          <span className="w-11">Rang</span>
          <span className="flex-1">Joueur</span>
          <span className="w-20 text-right">Niveau</span>
          <span className="w-28 text-right">
            {period === "monthly" ? "XP du mois" : "XP"}
          </span>
        </div>

        {isLoading && (
          <div className="px-4 py-6 text-sm text-muted-foreground">Chargement…</div>
        )}
        {isError && (
          <div className="px-4 py-6 text-sm text-destructive">
            Classement indisponible.
          </div>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            Aucun joueur classé pour l'instant.
          </div>
        )}

        {rows.map((row, index) => {
          const me = row.userId === userId;
          const points = period === "monthly" ? row.monthlyXp : row.totalXp;
          return (
            <div
              key={row.userId}
              className="flex items-center px-4 py-2.5"
              style={{
                borderBottom:
                  index < rows.length - 1 ? "1px solid var(--border)" : "none",
                background: me ? veil("var(--primary)", 8) : "transparent",
              }}
            >
              <span
                className="w-11 font-heading text-[15px] font-bold"
                style={{
                  color: index < 3 ? "var(--duel-score)" : "var(--muted-foreground)",
                }}
              >
                {row.rank}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <UserAvatar
                  name={row.displayName ?? "Joueur"}
                  color="var(--primary)"
                  size={30}
                  face={me}
                />
                <span className="truncate text-sm" style={{ fontWeight: me ? 600 : 500 }}>
                  {row.displayName ?? "Joueur"}
                </span>
                {row.country && <span className="text-sm">{row.country}</span>}
                {index === 0 && <Crown className="size-3.5 text-[var(--duel-score)]" />}
              </span>
              <span className="w-20 text-right text-sm text-muted-foreground">
                {row.level}
              </span>
              <span className="w-28 text-right font-heading text-sm font-bold text-[var(--duel-score)]">
                {points.toLocaleString("fr-FR")}
              </span>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
