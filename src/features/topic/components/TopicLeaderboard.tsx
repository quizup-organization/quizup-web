import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Toggle } from "@/components/ui/toggle";
import { LeaderboardCard } from "@/components/ui/leaderboard-card";
import { getUserId } from "@/lib/auth";
import { countryLabel } from "@/shared/utils/country";
import type { LeaderboardPeriod, LeaderboardScope } from "@/lib/services/leaderboard";
import { useTopicLeaderboard } from "../hooks/useTopicDetail";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "all-time", label: "Général" },
  { value: "monthly", label: "Mensuel" },
];

const SCOPES: { value: LeaderboardScope; label: string; icon: typeof Globe }[] = [
  { value: "world", label: "Monde", icon: Globe },
  { value: "following", label: "Abonnés", icon: Users },
];

const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** Classement d'un sujet — design Trophy (`LeaderboardCard`), données réelles du service. */
export function TopicLeaderboard({ topicId }: { topicId: string }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all-time");
  const [scope, setScope] = useState<LeaderboardScope>("world");
  const userId = getUserId();
  const navigate = useNavigate();
  const { data: rows = [], isLoading, isError } = useTopicLeaderboard(topicId, period, scope);

  const scopeLabel = SCOPES.find((s) => s.value === scope)?.label ?? "Monde";
  const periodLabel = period === "monthly" ? "ce mois-ci" : "de tous les temps";

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const subtitle =
    period === "monthly"
      ? `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} · ${scopeLabel}`
      : `${scopeLabel} · de tous les temps`;

  const rankings = rows.map((row) => ({
    userId: row.userId,
    userName: row.displayName ?? "Joueur",
    rank: row.rank,
    value: period === "monthly" ? row.monthlyXp : row.totalXp,
    byline: `Niveau ${row.level}${
      row.country ? ` · ${countryLabel(row.country)}` : ""
    }`,
  }));
  const podiumRankings = rankings.slice(0, 3);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5 bg-background py-1.5">
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

      {isLoading ? (
        <Card size="sm" className="px-4 py-6 text-sm text-muted-foreground">
          Chargement…
        </Card>
      ) : isError ? (
        <Card size="sm" className="px-4 py-6 text-sm text-destructive">
          Classement indisponible.
        </Card>
      ) : rows.length === 0 ? (
        <Card size="sm" className="px-4 py-6 text-sm text-muted-foreground">
          Aucun joueur classé pour l'instant.
        </Card>
      ) : (
        <LeaderboardCard
          title="Classement"
          subtitle={subtitle}
          fromDate={period === "monthly" ? monthStart : now}
          toDate={period === "monthly" ? monthEnd : now}
          podiumRankings={podiumRankings}
          rankings={rankings}
          currentUserId={userId ?? undefined}
          onUserClick={(ranking) => navigate(`/players/${ranking.userId}`)}
        />
      )}
    </div>
  );
}
