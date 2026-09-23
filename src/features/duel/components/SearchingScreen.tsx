import { useEffect, useState } from "react";
import { Bot, Globe, Users } from "lucide-react";
import { TopicIcon } from "@/shared/components/topic-icon";
import { TOKEN } from "@/shared/theme/tokens";

/** Positions des pastilles sur la carte, en pourcentage. Purement décoratif. */
const PIN_SPOTS = [
  { x: 14, y: 30 },
  { x: 22, y: 52 },
  { x: 31, y: 22 },
  { x: 38, y: 44 },
  { x: 46, y: 28 },
  { x: 52, y: 58 },
  { x: 61, y: 36 },
  { x: 69, y: 24 },
  { x: 74, y: 55 },
  { x: 83, y: 40 },
  { x: 88, y: 66 },
  { x: 27, y: 70 },
];

/** Couleurs des pastilles (joueurs anonymes en attente d'appariement). */
const PIN_COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#ef4444",
];

/** Critères d'appariement (Matchmaking côté serveur). */
const CRITERIA = [
  { icon: Users, label: "Niveau ±5" },
  { icon: Globe, label: "Même pays d'abord" },
  { icon: Bot, label: "Repli bot après 10 s" },
];

interface SearchingScreenProps {
  topic: { name: string; emoji?: string; color?: string };
}

/**
 * File de matchmaking (duel humain) — écran animé : carte de pastilles de joueurs,
 * critères d'appariement et compteur de temps en file. Le déroulé réel (ticket +
 * WebSocket) est piloté par `MatchmakingPage`.
 */
export function SearchingScreen({ topic }: SearchingScreenProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${TOKEN.secondary} 1.4px, transparent 1.4px)`,
          backgroundSize: "13px 13px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 40%, transparent 100%)",
        }}
      />
      <div
        className="absolute"
        style={{ left: "50%", top: "44%", transform: "translate(-50%,-50%)" }}
      >
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="qu-ping absolute"
            style={{
              left: -90,
              top: -90,
              width: 180,
              height: 180,
              borderRadius: 999,
              border: `1.5px solid ${TOKEN.primary}`,
              animationDelay: `${index * 0.8}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex-1">
        {PIN_SPOTS.map((spot, index) => (
          <div
            key={`${spot.x}-${spot.y}`}
            className="qu-bob absolute"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              animationDelay: `${(index % 5) * 0.4}s`,
            }}
          >
            <div
              className="flex size-[34px] items-center justify-center"
              style={{
                borderRadius: "50% 50% 50% 4px",
                transform: "rotate(-45deg)",
                background: PIN_COLORS[index % PIN_COLORS.length],
                boxShadow: "0 6px 14px rgba(0,0,0,.55)",
              }}
            >
              <Users size={14} style={{ transform: "rotate(45deg)", color: "#0b0b0d" }} />
            </div>
          </div>
        ))}
      </div>

      <div className="relative pb-[34px] text-center">
        <TopicIcon
          topic={{ emoji: topic.emoji ?? "❔", color: topic.color ?? TOKEN.primary }}
          size={40}
        />
        <div style={{ color: TOKEN.mutedFg, fontSize: 13, marginTop: 10 }}>
          {topic.name}
        </div>
        <div
          className="qu-flash"
          aria-live="polite"
          style={{
            color: TOKEN.score,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.16em",
            marginTop: 18,
          }}
        >
          RECHERCHE DE L&apos;ADVERSAIRE
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-4"
          style={{ marginTop: 14 }}
        >
          {CRITERIA.map((criterion) => (
            <span
              key={criterion.label}
              className="flex items-center gap-1.5"
              style={{ color: TOKEN.mutedFg, fontSize: 11.5 }}
            >
              <criterion.icon size={12} /> {criterion.label}
            </span>
          ))}
        </div>

        <div
          aria-live="off"
          style={{
            color: TOKEN.mutedFg,
            fontSize: 11.5,
            marginTop: 8,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          En file depuis {elapsed} s
        </div>
      </div>
    </div>
  );
}
