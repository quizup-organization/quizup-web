import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { UserAvatar, type AvatarIdentity } from "@/shared/components/user-avatar";
import { clamp } from "@/lib/helpers";
import { TOKEN, veil } from "@/shared/theme/tokens";
import { ROUND_SECONDS } from "../lib/duel-constants";
import type { GaugeState } from "./ScoreGauge";

/** Couleur du score, identique à celle des jauges latérales. */
function scoreColor(state: GaugeState): string {
  if (state === "correct") return TOKEN.correctAccent;
  if (state === "wrong") return TOKEN.wrongAccent;
  return TOKEN.gauge;
}

interface MatchHeaderProps {
  playerName: string;
  opponentName: string;
  playerAvatar?: AvatarIdentity;
  opponentAvatar?: AvatarIdentity;
  scores: { you: number; them: number };
  /** État (correct/erreur) de chaque score, pour colorer le compteur comme les jauges. */
  scoreStates?: { you: GaugeState; them: GaugeState };
  timeLeft: number;
  gain: { you: number; them: number } | null;
  round: number;
  firstAnswerPct: number | null;
  /** État figé (revue) : scores et chrono posés sans animation. */
  instant?: boolean;
  /** Info affichée sous le chrono (revue) : « premier à répondre » + temps de réponse. */
  centerNote?: string;
  onQuit?: () => void;
}

export function MatchHeader({
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  scores,
  scoreStates,
  timeLeft,
  gain,
  round,
  firstAnswerPct,
  instant = false,
  centerNote,
  onQuit,
}: MatchHeaderProps) {
  const pct = clamp((timeLeft / ROUND_SECONDS) * 100, 0, 100);
  const frozenWidth = firstAnswerPct != null ? Math.max(0, firstAnswerPct - pct) : 0;
  const numeric = {
    fontFamily: TOKEN.fontDisplay,
    fontWeight: 700,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums",
  } as const;

  return (
    <div
      style={{
        background: TOKEN.duelBg,
        borderBottom: `1px solid ${TOKEN.sidebarBorder}`,
      }}
    >
      <div
        className="relative h-[5px] overflow-hidden"
        style={{ background: TOKEN.duelBg }}
      >
        {frozenWidth > 0 && (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${pct}%`,
              width: `${frozenWidth}%`,
              background: veil(TOKEN.timer, 45),
            }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${pct}%`,
            background: TOKEN.timer,
            transition: "width .05s linear",
          }}
        />
      </div>

      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          columnGap: "clamp(8px, 2vw, 16px)",
          padding: "clamp(6px, 1.6dvh, 10px) clamp(12px, 4vw, 22px)",
        }}
      >
        <div className="flex min-w-0 items-center">
          <UserAvatar
            name={playerName}
            userId={playerAvatar?.userId}
            avatarOptions={playerAvatar?.avatarOptions}
            size={40}
          />
          <div className="relative min-w-0 flex-1" style={{ marginLeft: 12 }}>
            <div className="truncate" style={{ fontSize: 13.5, fontWeight: 600 }}>
              {playerName}
            </div>
            <div
              data-slot="score-you"
              style={{
                ...numeric,
                fontSize: "clamp(16px, 2.8dvh, 22px)",
                color: scoreColor(scoreStates?.you ?? "idle"),
              }}
            >
              {instant ? scores.you : <AnimatedNumber value={scores.you} />}
            </div>
            {gain && gain.you > 0 && (
              <div
                key={`gain-${round}`}
                style={{
                  position: "absolute",
                  left: 46,
                  top: 18,
                  color: TOKEN.correctAccent,
                  ...numeric,
                  fontSize: 15,
                  animation: "qu-rise 1.4s ease-out forwards",
                }}
              >
                +{gain.you}
              </div>
            )}
          </div>
        </div>

        <div className="text-center whitespace-nowrap">
          <div
            style={{
              color: TOKEN.timer,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.14em",
            }}
          >
            TEMPS RESTANT
          </div>
          <div
            role="timer"
            aria-live="off"
            aria-label={`Temps restant : ${Math.ceil(timeLeft)} secondes`}
            style={{
              ...numeric,
              fontSize: "clamp(16px, 2.9dvh, 24px)",
              color: timeLeft <= 3 ? TOKEN.timerUrgent : TOKEN.timer,
            }}
          >
            {Math.ceil(timeLeft)}
          </div>
          {centerNote && (
            <div
              data-slot="timer-note"
              title={centerNote}
              style={{
                marginTop: 2,
                maxWidth: "38vw",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: 10.5,
                fontWeight: 600,
                color: TOKEN.duelSurfaceMuted,
              }}
            >
              {centerNote}
            </div>
          )}
        </div>

        <div className="flex min-w-0 items-center justify-end">
          <div className="min-w-0" style={{ marginRight: 12, textAlign: "right" }}>
            <div className="truncate" style={{ fontSize: 13.5, fontWeight: 600 }}>
              {opponentName}
            </div>
            <div
              data-slot="score-them"
              style={{
                ...numeric,
                fontSize: "clamp(16px, 2.8dvh, 22px)",
                color: scoreColor(scoreStates?.them ?? "idle"),
              }}
            >
              {instant ? scores.them : <AnimatedNumber value={scores.them} />}
            </div>
          </div>
          <UserAvatar
            name={opponentName}
            userId={opponentAvatar?.userId}
            avatarOptions={opponentAvatar?.avatarOptions}
            size={40}
          />
        </div>
      </div>

      {onQuit && (
        <div
          className="flex items-center justify-center"
          style={{
            borderTop: `1px solid ${TOKEN.border}`,
            background: TOKEN.duelBg,
            padding: "clamp(3px, 1dvh, 6px) clamp(12px, 4vw, 22px)",
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onQuit}
            aria-label="Abandonner la partie"
            className="h-[30px] text-xs"
            style={{ color: TOKEN.mutedFg }}
          >
            <LogOut size={14} /> Abandonner
          </Button>
        </div>
      )}
    </div>
  );
}
