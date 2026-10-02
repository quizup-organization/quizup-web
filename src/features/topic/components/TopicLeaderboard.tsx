import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, MapPin, Users } from "lucide-react";
import {
  Card,
  Label,
  ListBox,
  Select,
  ToggleButton,
} from "@heroui/react";
import { LeaderboardCard } from "./LeaderboardCard";
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

/** Classement d'un sujet — design Trophy (`LeaderboardCard`), données réelles du service. */
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2.5 bg-background py-1.5">
        <div className="flex items-center gap-1.5">
          {PERIODS.map((p) => (
            <ToggleButton
              key={p.value}
              size="sm"
              isSelected={period === p.value}
              onChange={() => setPeriod(p.value)}
            >
              {p.label}
            </ToggleButton>
          ))}
        </div>
        {period === "MONTHLY" && (
          <Select
            value={month}
            onChange={(value) => {
              if (typeof value === "string") {
                setMonth(value);
              }
            }}
          >
            <Select.Trigger className="w-[170px]" aria-label="Choisir le mois">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {months.map((m) => (
                  <ListBox.Item key={m.value} id={m.value} textValue={m.label}>
                    <Label>{m.label}</Label>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          {SCOPES.map((s) => (
            <ToggleButton
              key={s.value}
              size="sm"
              isSelected={scope === s.value}
              onChange={() => setScope(s.value)}
            >
              <s.icon /> {s.label}
            </ToggleButton>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-xs text-muted">
          {scopeLabel} · {periodLabel}
        </span>
      </div>

      {isLoading ? (
        <Card className="px-4 py-6 text-sm text-muted">
          Chargement…
        </Card>
      ) : isError ? (
        <Card className="px-4 py-6 text-sm text-danger">
          Classement indisponible.
        </Card>
      ) : rankings.length === 0 ? (
        <Card className="px-4 py-6 text-sm text-muted">
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
    </div>
  );
}
