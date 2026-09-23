import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, Check, Play, Repeat, Save, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { useCurrentPlayer } from "@/features/shell";
import { usePresence } from "@/shared/hooks/usePresence";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import {
  useChallengeActions,
  useChallengeById,
} from "../hooks/useChallenges";
import { useStartChallengeRun } from "../hooks/useChallengeRuns";

type Presence = "online" | "ready" | "waiting" | "offline";

const PRESENCE_COLOR: Record<Presence, string> = {
  online: "var(--duel-correct-accent)",
  ready: "var(--duel-correct-accent)",
  waiting: "var(--duel-score)",
  offline: "var(--muted-foreground)",
};

const PRESENCE_LABEL: Record<Presence, string> = {
  online: "En ligne",
  ready: "Prêt",
  waiting: "En attente",
  offline: "Hors ligne",
};

function timeLeftLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expiré";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} h`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

function PhoneSlot({
  name,
  color,
  presence,
  status,
  push,
}: {
  name: string;
  color: string;
  presence: Presence;
  status: string;
  push?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center border-2 border-border bg-card"
        style={{
          width: 84,
          height: 150,
          borderRadius: 18,
          boxShadow: "0 10px 24px rgba(0,0,0,.4)",
        }}
      >
        <UserAvatar name={name} color={color} face size={44} />
        <span
          className="absolute rounded-full"
          style={{
            top: 10,
            right: 12,
            width: 8,
            height: 8,
            background: PRESENCE_COLOR[presence],
          }}
        />
        {push && (
          <span
            className="qu-push absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground"
            aria-hidden
            style={{ top: -10, left: -10, width: 28, height: 28 }}
          >
            <Bell size={14} />
          </span>
        )}
      </div>
      <div className="max-w-[120px] text-center">
        <div className="truncate text-[12.5px] font-semibold">{name}</div>
        <div
          className="mt-px flex items-center justify-center gap-1.5 text-[11px]"
          style={{ color: PRESENCE_COLOR[presence] }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ background: PRESENCE_COLOR[presence] }}
          />
          {PRESENCE_LABEL[presence]}
        </div>
        <div className="mt-0.5 text-[10.5px] text-muted-foreground">{status}</div>
      </div>
    </div>
  );
}

/**
 * Lobby privé d'un défi (écran d'attente plein écran).
 * Écran dérivé du défi + WS social ; sur acceptation la saga crée la partie → redirection duel.
 */
export function ChallengeLobbyPage() {
  const { challengeId = "" } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { view, isLoading, isError, isFetching } = useChallengeById(challengeId);
  const { profile } = useCurrentPlayer();
  const { accept, decline } = useChallengeActions();
  const startRun = useStartChallengeRun();
  const presence = usePresence(view?.otherId ?? "");
  const [, tick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const status = view?.challenge.status;
  const gameId = view?.challenge.gameId ?? null;

  useEffect(() => {
    if (status === "ACCEPTED" && gameId) {
      navigate(`/duel/${gameId}`, { replace: true });
    }
  }, [status, gameId, navigate]);

  if (isLoading || (!view && isFetching)) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--duel-bg)] text-sm text-muted-foreground">
        Chargement du défi…
      </div>
    );
  }

  if (isError || !view) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--duel-bg)] text-center">
        <div className="text-base font-semibold">Défi introuvable</div>
        <Button variant="outline" onClick={() => navigate("/challenges")}>
          Retour aux défis
        </Button>
      </div>
    );
  }

  const { challenge, direction, topic } = view;
  const me = profile?.displayName ?? "Toi";
  const opponentName = view.otherName;
  const isPending = status === "PENDING";
  const opponentPresence: Presence =
    status === "ACCEPTED"
      ? "ready"
      : presence.data == null
        ? "waiting"
        : presence.data.online
          ? "online"
          : "offline";
  const opponentStatus =
    status === "ACCEPTED"
      ? "A accepté"
      : status === "DECLINED"
        ? "A refusé"
        : status === "EXPIRED"
          ? "Défi expiré"
          : "Notification push envoyée";
  const statusText =
    status === "ACCEPTED"
      ? "Défi accepté — la partie démarre…"
      : status === "DECLINED"
        ? "Défi refusé"
        : status === "EXPIRED"
          ? "Défi expiré"
          : `En attente que ${opponentName} accepte.`;
  const pending = accept.isPending || decline.isPending;

  const isChallenger = profile?.userId === challenge.challengerId;
  const myRunGameId = isChallenger
    ? challenge.challengerGameId
    : challenge.challengedGameId;
  const otherRunGameId = isChallenger
    ? challenge.challengedGameId
    : challenge.challengerGameId;
  const canPlayRun =
    !myRunGameId && (status === "PENDING" || status === "ACCEPTED");
  const sessionComplete = !!challenge.replayGameId;
  const runPending = pending || startRun.isPending;

  function playRun() {
    startRun.mutate({
      challengeId: challenge.challengeId,
      topicId: challenge.topicId,
      displayName: me,
      opponentId: otherRunGameId ? view?.otherId : undefined,
      opponentName: otherRunGameId ? opponentName : undefined,
      ghostGameId: otherRunGameId ?? undefined,
    });
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--duel-bg)]">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: "radial-gradient(var(--border) 1.4px, transparent 1.4px)",
          backgroundSize: "13px 13px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 45%, #000 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 45%, #000 40%, transparent 100%)",
        }}
      />
      <button
        onClick={() => navigate("/challenges")}
        aria-label="Quitter le lobby"
        className="qu-hoverable absolute top-4 right-[18px] z-10 flex size-[34px] items-center justify-center rounded-md border border-border bg-foreground/5 text-muted-foreground"
      >
        <X size={16} />
      </button>

      <div className="flex items-center justify-center gap-3 px-5 pt-[22px] text-center">
        <TopicIcon topic={topic} size={40} />
        <div className="text-left">
          <div className="font-heading text-lg font-extrabold tracking-tight">
            {topic.name}
          </div>
          <div
            className="text-[11.5px] font-semibold"
            style={{ color: categoryColor(topic.category) }}
          >
            {categoryLabel(topic.category, topic.category)}
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <PhoneSlot
          name={me}
          color="var(--primary)"
          presence="online"
          status="C'est toi"
        />
        <div className="hidden items-center sm:flex" aria-hidden>
          <span className="qu-dash h-[3px] w-[72px] text-primary opacity-85" />
          <span className="mx-2 inline-flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Zap size={16} fill="currentColor" strokeWidth={0} />
          </span>
          <span className="qu-dash h-[3px] w-[72px] text-primary opacity-85" />
        </div>
        <PhoneSlot
          name={opponentName}
          color="#f97316"
          presence={opponentPresence}
          status={opponentStatus}
          push={isPending}
        />
      </div>

      <div className="mt-[30px] px-5 text-center">
        <div
          className="text-[13.5px] font-semibold"
          style={{
            color:
              status === "ACCEPTED"
                ? "var(--duel-correct-accent)"
                : "var(--muted-foreground)",
          }}
        >
          {statusText}
        </div>
        {isPending && (
          <div className="mt-1 text-xs text-muted-foreground">
            Expire dans {timeLeftLabel(challenge.expiresAt)} · le défi reste valable
            24 h
          </div>
        )}
        {myRunGameId && (
          <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Save size={12} />
            {sessionComplete
              ? "Session terminée — les deux runs sont enregistrés"
              : `Ton run est enregistré${!otherRunGameId ? ` — en attente de ${opponentName}` : ""}`}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3 px-5">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {canPlayRun && (
            <Button size="lg" disabled={runPending} onClick={playRun}>
              {otherRunGameId ? (
                <>
                  <Repeat size={16} /> Rejouer le run de {opponentName}
                </>
              ) : (
                <>
                  <Play size={16} /> Jouer mon run
                </>
              )}
            </Button>
          )}
          {isPending && direction === "received" && (
            <>
              <Button
                size="lg"
                disabled={runPending}
                onClick={() => accept.mutate(challenge.challengeId)}
              >
                <Check /> Accepter en direct
              </Button>
              <Button
                variant="outline"
                size="lg"
                disabled={runPending}
                onClick={() => decline.mutate(challenge.challengeId)}
              >
                Refuser
              </Button>
            </>
          )}
          {isPending && direction === "sent" && (
            <Button
              variant="outline"
              size="lg"
              disabled={runPending}
              onClick={() => decline.mutate(challenge.challengeId)}
            >
              Annuler le défi
            </Button>
          )}
          {sessionComplete && challenge.replayGameId && (
            <Button
              size="lg"
              onClick={() => navigate(`/duel/${challenge.replayGameId}`)}
            >
              <Play size={16} /> Voir le résultat
            </Button>
          )}
          {status === "ACCEPTED" && gameId && (
            <Button size="lg" onClick={() => navigate(`/duel/${gameId}`)}>
              <Play size={16} /> Rejoindre la partie
            </Button>
          )}
          {!isPending && status !== "ACCEPTED" && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/challenges")}
            >
              Retour
            </Button>
          )}
        </div>

        {canPlayRun && (
          <p className="max-w-[380px] text-center text-xs leading-relaxed text-muted-foreground">
            {otherRunGameId
              ? `Rejoue les mêmes questions contre le run de ${opponentName}.`
              : "Joue ta session en différé : ton adversaire la rejouera quand il voudra."}
          </p>
        )}
        {isPending && direction === "received" && (
          <p className="max-w-[360px] text-center text-xs leading-relaxed text-muted-foreground">
            « Accepter en direct » crée une partie synchronisée : tu rejoins l'arène
            avec ton adversaire.
          </p>
        )}
      </div>
    </div>
  );
}
