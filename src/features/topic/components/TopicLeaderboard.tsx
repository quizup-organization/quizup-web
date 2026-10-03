import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, MapPin, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { LeaderboardCard } from "@/components/ui/leaderboard-card";
import { PageContainer } from "@/features/shell";
import { getSessionUserId as getUserId } from "@/features/auth";
import { countryLabel } from "@/shared/utils/country";
import type { LeaderboardPeriod, LeaderboardScope } from "@/features/topics";
import { useTopicLeaderboard } from "../hooks/useTopicDetail";

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "ALL_TIME", label: "Général" },
  { value: "MONTHLY", label: "Mensuel" },
];

const SCOPES: { value: LeaderboardScope; label: string; icon: typeof Globe }[] = [
  { value: "WORLD", label: "Monde", icon: Globe },
  { value: "FOLLOWING", label: "Abonnés", icon: Users },
  { value: "COUNTRY", label: "Pays", icon: MapPin },
];

const MONTH_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Les 12 derniers mois (mois courant inclus), du plus récent au plus ancien. */
function lastTwelveMonths(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return { value: monthKey(date), label: MONTH_FORMAT.format(date) };
  });
}

/**
 * Classement d'un sujet — filtres en **bande pleine largeur** (comme `SearchToolbar` sur la
 * page Personnes), puis contenu dans un `PageContainer`. Design Trophy (`LeaderboardCard`).
 */
export function TopicLeaderboard({ topicId }: { topicId: string }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("ALL_TIME");
  const [scope, setScope] = useState<LeaderboardScope>("WORLD");
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const userId = getUserId();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useTopicLeaderboard(topicId, {
    period,
    scope,
    month: period === "MONTHLY" ? month : undefined,
    page: 0,
    size: 50,
  });

  const scopeLabel = SCOPES.find((s) => s.value === scope)?.label ?? "Monde";
  const periodLabel = period === "MONTHLY" ? "ce mois-ci" : "de tous les temps";

  const months = lastTwelveMonths();
  const selectedMonthLabel =
    months.find((m) => m.value === month)?.label ?? MONTH_FORMAT.format(new Date());
  const [year, monthNumber] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNumber - 1, 1);
  const monthEnd = new Date(year, monthNumber, 0);
  const subtitle =
    period === "MONTHLY"
      ? `${selectedMonthLabel} · ${scopeLabel}`
      : `${scopeLabel} · de tous les temps`;

  const rankings = (data?.entries.content ?? []).map((entry) => ({
    userId: entry.userId,
    userName: entry.pseudonym ?? "Joueur",
    rank: entry.rank,
    value: period === "MONTHLY" ? entry.monthlyXp : entry.totalXp,
    avatarOptions: entry.avatarOptions,
    byline: `Niveau ${entry.level}${
      entry.country ? ` · ${countryLabel(entry.country)}` : ""
    }`,
  }));
  const podiumRankings = rankings.slice(0, 3);

  return (
    <div className="flex flex-col">
      <div className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-2.5 px-4 py-3 sm:px-6">
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
          {period === "MONTHLY" && (
            <Select
              value={month}
              onValueChange={(value) => {
                if (value) {
                  setMonth(value);
                }
              }}
            >
              <SelectTrigger size="sm" className="w-[170px]" aria-label="Choisir le mois">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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
      </div>

      <PageContainer style={{ paddingTop: 16 }}>
        {isLoading ? (
          <Card size="sm" className="px-4 py-6 text-sm text-muted-foreground">
            Chargement…
          </Card>
        ) : isError ? (
          <Card size="sm" className="px-4 py-6 text-sm text-destructive">
            Classement indisponible.
          </Card>
        ) : rankings.length === 0 ? (
          <Card size="sm" className="px-4 py-6 text-sm text-muted-foreground">
            Aucun joueur classé pour l'instant.
          </Card>
        ) : (
          <LeaderboardCard
            title="Classement"
            subtitle={subtitle}
            fromDate={period === "MONTHLY" ? monthStart : new Date()}
            toDate={period === "MONTHLY" ? monthEnd : new Date()}
            podiumRankings={podiumRankings}
            rankings={rankings}
            currentUserId={userId ?? undefined}
            onUserClick={(ranking) => navigate(`/players/${ranking.userId}`)}
          />
        )}
      </PageContainer>
    </div>
  );
}
