import { cn } from "@/lib/utils";
import { clamp } from "@/lib/helpers";
import { TOKEN, veil } from "@/shared/theme/tokens";
import { MAX_SCORE } from "../lib/duel-constants";

export type GaugeState = "idle" | "correct" | "wrong";

interface ScoreGaugeProps {
  score: number;
  state: GaugeState;
  side: "left" | "right";
  label: string;
}

export function ScoreGauge({ score, state, side, label }: ScoreGaugeProps) {
  const color =
    state === "correct"
      ? TOKEN.correctAccent
      : state === "wrong"
        ? TOKEN.wrongAccent
        : TOKEN.gauge;
  const pct = clamp((score / MAX_SCORE) * 100, 0, 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={MAX_SCORE}
      className={cn("relative w-[7px] shrink-0 self-stretch rounded-full md:w-[11px]")}
      style={{
        background: veil(TOKEN.gaugeTrack, 90),
        boxShadow: `inset 0 0 0 1px ${veil(TOKEN.fg, 8)}`,
        margin: side === "left" ? "0 12px 0 10px" : "0 10px 0 12px",
      }}
    >
      <div
        className="qu-gauge absolute inset-x-0 bottom-0 rounded-full"
        style={{ height: `${pct}%`, background: color }}
      />
    </div>
  );
}
