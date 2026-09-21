import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { clamp } from "@/lib/helpers";
import { TOKEN, veil } from "@/theme/tokens";
import { ROUND_SECONDS } from "../lib/duel-constants";
import type { GaugeState } from "./ScoreGauge";

/** Couleur du score, identique à celle des jauges latérales. */
function scoreColor(state: GaugeState): string {
  if (state === "correct") return TOKEN.correctAccent;
  if (state === "wrong") return TOKEN.wrongAccent;
  return TOKEN.gauge;
}

/**
 * Compteur « horloge numérique » : incrémente de 1 en 1 vers la valeur cible, sur la même
 * durée que la transition des jauges latérales (`height .55s`).
 */
function AnimatedNumber({ value, duration = 550 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const ref = useRef(value);

  useEffect(() => {
    const from = ref.current;
    if (from === value) return;
    const steps = Math.abs(value - from);
    const dir = Math.sign(value - from);
    const stepMs = Math.max(16, Math.round(duration / steps));
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      const next = from + dir * Math.min(i, steps);
      ref.current = next;
      setDisplay(next);
      if (i >= steps) clearInterval(id);
    }, stepMs);
    return () => clearInterval(id);
  }, [value, duration]);

  return <>{display}</>;
}

interface MatchHeaderProps {
  playerName: string;
  opponentName: string;
  opponentColor?: string;
  scores: { you: number; them: number };
  /** État (correct/erreur) de chaque score, pour colorer le compteur comme les jauges. */
  scoreStates?: { you: GaugeState; them: GaugeState };
  timeLeft: number;
  gain: { you: number; them: number } | null;
  round: number;
  firstAnswerPct: number | null;
  opponentHidden?: boolean;
  onQuit?: () => void;
}

export function MatchHeader({
  playerName,
  opponentName,
  opponentColor,
  scores,
  scoreStates,
  timeLeft,
  gain,
  round,
  firstAnswerPct,
  opponentHidden,
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
        className="flex items-center"
        style={{ padding: "clamp(6px, 1.6dvh, 10px) clamp(12px, 4vw, 22px)" }}
      >
        <UserAvatar
          name={playerName}
          face
          size={40}
          glow={TOKEN.correctAccent}
        />
        <div className="relative" style={{ marginLeft: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{playerName}</div>
          <div
            data-slot="score-you"
            style={{
              ...numeric,
              fontSize: "clamp(16px, 2.8dvh, 22px)",
              color: scoreColor(scoreStates?.you ?? "idle"),
            }}
          >
            <AnimatedNumber value={scores.you} />
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

        <div className="flex-1 text-center">
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
        </div>

        {!opponentHidden && (
          <>
            <div style={{ marginRight: 12, textAlign: "right" }}>
              <div
                className="truncate"
                style={{ fontSize: 13.5, fontWeight: 600, maxWidth: 170 }}
              >
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
                <AnimatedNumber value={scores.them} />
              </div>
            </div>
            <UserAvatar
              name={opponentName}
              color={opponentColor}
              size={40}
              glow={opponentColor ?? null}
            />
          </>
        )}
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
