import type { CSSProperties, ReactNode } from "react";
import { Zap } from "lucide-react";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { cn } from "@/lib/utils";
import { TOKEN } from "@/shared/theme/tokens";

const WATERMARK_EMOJIS = [
  "🎯",
  "🧠",
  "🌍",
  "⚡",
  "🎲",
  "🏆",
  "🎵",
  "🔬",
  "📚",
  "🎬",
  "⚽",
  "🍔",
  "🎮",
  "🗺️",
  "🐾",
  "💡",
  "🎨",
  "💻",
  "🃏",
  "⭐",
  "🔥",
  "🌙",
  "🍀",
  "🎤",
];

interface VersusPlayer {
  name: string;
  title: string;
  level: number;
  country?: string;
}

interface VersusOpponent {
  name: string;
  color?: string;
  title?: string;
  level?: number;
  country?: string;
}

interface VersusTopic {
  name: string;
  emoji?: string;
  color?: string;
}

interface VersusScreenProps {
  player: VersusPlayer;
  opponent: VersusOpponent;
  topic: VersusTopic;
  opponentHidden?: boolean;
}

function NamePlate({
  name,
  accent,
  side,
}: {
  name: string;
  accent: string;
  side: "top" | "bottom";
}) {
  const label = name.split("·")[0].trim();
  const style: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    fontFamily: TOKEN.fontDisplay,
    fontWeight: 900,
    fontStyle: "italic",
    fontSize: "clamp(40px, 7vw, 86px)",
    letterSpacing: "-0.045em",
    lineHeight: 0.85,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color: "transparent",
    WebkitTextStroke: `2px ${accent}`,
    opacity: 0.4,
    pointerEvents: "none",
    userSelect: "none",
  };
  style[side === "top" ? "left" : "right"] = "34%";
  return (
    <span aria-hidden style={style}>
      {label}
    </span>
  );
}

interface IdentityProps {
  name: string;
  title: string;
  level: number;
  country?: string;
  avatar: ReactNode;
  side: "top" | "bottom";
}

function Identity({
  name,
  title,
  level,
  country,
  avatar,
  side,
}: IdentityProps) {
  const reversed = side === "bottom";
  const flag = countryFlag(country);
  const label = countryLabel(country) || country || "";
  return (
    <div
      className={cn(
        "relative flex items-center gap-5",
        reversed && "flex-row-reverse",
      )}
      style={{ zIndex: 2 }}
    >
      <span
        aria-hidden
        className={side === "top" ? "qu-vs-left" : "qu-vs-right"}
        style={{ animationDelay: ".36s" }}
      >
        {avatar}
      </span>
      <div
        className={side === "top" ? "qu-vs-left" : "qu-vs-right"}
        style={{ textAlign: reversed ? "right" : "left", animationDelay: ".44s" }}
      >
        <div
          style={{
            fontFamily: TOKEN.fontDisplay,
            fontSize: "clamp(22px, 3.2vw, 34px)",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            color: TOKEN.fg,
          }}
        >
          {name}
        </div>
        {title ? (
          <div style={{ color: TOKEN.mutedFg, fontSize: 13.5, marginTop: 3 }}>
            {title}
          </div>
        ) : null}
        {level > 0 ? (
          <div style={{ color: TOKEN.mutedFg, fontSize: 13.5 }}>
            Niveau {level}
          </div>
        ) : null}
        {label ? (
          <div style={{ color: TOKEN.mutedFg, fontSize: 13.5, marginTop: 2 }}>
            {flag} {label}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function VersusScreen({
  player,
  opponent,
  topic,
  opponentHidden,
}: VersusScreenProps) {
  const topicForIcon = {
    emoji: topic.emoji ?? "❔",
    color: topic.color ?? TOKEN.primary,
  };
  return (
    <div
      className="relative flex-1 overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <div
        className="qu-vs-panel-top absolute inset-x-0 top-0 overflow-hidden"
        style={{
          height: "50%",
          background:
            "radial-gradient(125% 115% at 50% 100%, #7e1b1b 0%, #41100f 45%, #150606 100%)",
        }}
      >
        <div
          className="qu-burst-spin absolute"
          style={{
            left: "50%",
            top: "50%",
            width: "150%",
            aspectRatio: "1",
            transform: "translate(-50%,-50%)",
            background:
              "conic-gradient(from 0deg, transparent 0deg 7deg, rgba(255,255,255,.06) 7deg 13deg, transparent 13deg 20deg)",
            opacity: 0.8,
          }}
        />
        <NamePlate name={player.name} accent={TOKEN.primary} side="top" />
        <div
          className="absolute inset-0 flex items-center"
          style={{ padding: "0 clamp(20px, 6vw, 90px)" }}
        >
          <Identity
            name={player.name}
            title={player.title}
            level={player.level}
            country={player.country}
            side="top"
            avatar={<UserAvatar name={player.name} face size={80} />}
          />
        </div>
        <div
          className="qu-scan absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,.26) 0 2px, transparent 2px 6px)",
          }}
        />
      </div>

      <div
        className="qu-vs-panel-bottom absolute inset-x-0 bottom-0 overflow-hidden"
        style={{
          height: "50%",
          background: "linear-gradient(180deg, #2c2c31 0%, #191a1e 100%)",
        }}
      >
        <div
          className="absolute inset-0 grid content-around justify-items-center opacity-[0.06]"
          style={{ gridTemplateColumns: "repeat(6, 1fr)", padding: 14, fontSize: 26 }}
        >
          {WATERMARK_EMOJIS.map((emoji, index) => (
            <span key={index}>{emoji}</span>
          ))}
        </div>
        {!opponentHidden && (
          <NamePlate name={opponent.name} accent="#e0483a" side="bottom" />
        )}
        <div
          className="absolute inset-0 flex items-center justify-end"
          style={{ padding: "0 clamp(20px, 6vw, 90px)" }}
        >
          {opponentHidden ? (
            <div
              className="relative flex flex-row-reverse items-center gap-5"
              style={{ zIndex: 2 }}
            >
              <div
                className="inline-flex shrink-0 items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 999,
                  border: `2px dashed ${TOKEN.border}`,
                  color: TOKEN.mutedFg,
                  fontSize: 30,
                }}
              >
                👻
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: TOKEN.fontDisplay,
                    fontSize: 26,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {opponent.name}
                </div>
                <div
                  style={{ color: TOKEN.mutedFg, fontSize: 13.5, marginTop: 3 }}
                >
                  Fantôme · run pas encore joué
                </div>
              </div>
            </div>
          ) : (
            <Identity
              name={opponent.name}
              title={opponent.title ?? ""}
              level={opponent.level ?? 0}
              country={opponent.country}
              side="bottom"
              avatar={
                <UserAvatar
                  name={opponent.name}
                  color={opponent.color}
                  size={80}
                />
              }
            />
          )}
        </div>
        <div
          className="qu-scan absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,.22) 0 2px, transparent 2px 6px)",
            animationDirection: "reverse",
          }}
        />
      </div>

      <div
        className="absolute"
        style={{ left: 0, right: 0, top: "50%", transform: "translateY(-50%)" }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: -6,
            height: 2,
            background: TOKEN.fg,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 6,
            height: 2,
            background: TOKEN.fg,
            opacity: 0.9,
          }}
        />
      </div>

      <div
        className="absolute"
        style={{ left: 0, right: 0, top: 20, zIndex: 3, textAlign: "center" }}
      >
        <TopicIcon topic={topicForIcon} size={34} className="mx-auto" />
        <div style={{ color: TOKEN.mutedFg, fontSize: 12, marginTop: 6 }}>
          {topic.name}
        </div>
      </div>

      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        <div
          className="relative inline-flex items-center justify-center"
          style={{
            width: 132,
            height: 132,
            borderRadius: 999,
            background: TOKEN.duelBg,
            border: `3px solid ${TOKEN.fg}`,
          }}
        >
          {[0, 1].map((index) => (
            <span
              key={index}
              aria-hidden
              className="qu-pulse-ring absolute inset-0 rounded-full"
              style={{
                border: `2px solid ${TOKEN.fg}`,
                animationDelay: `${index * 1.2}s`,
              }}
            />
          ))}
          <Zap size={50} fill={TOKEN.fg} color={TOKEN.fg} strokeWidth={0} />
        </div>
      </div>
    </div>
  );
}
