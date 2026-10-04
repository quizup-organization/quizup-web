import { useEffect, useState, type ReactNode } from "react";
import { Clock, Swords } from "lucide-react";
import { UserAvatar } from "@/shared/components/user-avatar";
import { TOKEN } from "@/shared/theme/tokens";
import { WaitingStatusPill } from "./WaitingStatusPill";
import { WaitingTopic } from "./WaitingTopic";

interface LobbyWaitingScreenProps {
  topic: {
    name: string;
    emoji?: string;
    color?: string;
    imageUrl?: string;
    category?: string | null;
    categoryLabel?: string | null;
  };
  nominative: boolean;
  opponent?: {
    pseudonym?: string | null;
    userId: string;
    avatarOptions?: string | null;
  } | null;
  expiresAt?: string | null;
  /** Contenu additionnel (partage lien + QR pour un salon non nominatif). */
  children?: ReactNode;
}

/** Libellé de temps restant avant expiration (ex. « 41 min »). */
function timeLeftLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expiré";
  const minutes = Math.floor(ms / 60_000);
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)} h ${(minutes % 60).toString().padStart(2, "0")} min`;
  }
  return `${minutes} min`;
}

/**
 * Salle d'attente d'un salon privé — même langage visuel que la file de matchmaking :
 * fond duel, sujet et état, ondulations centrées sur l'avatar pour un défi nominatif.
 * Le QR/partage éventuel est fourni en `children`.
 */
export function LobbyWaitingScreen({
  topic,
  nominative,
  opponent,
  expiresAt,
  children,
}: LobbyWaitingScreenProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const label = nominative
    ? `En attente de ${opponent?.pseudonym ?? "ton adversaire"}…`
    : "En attente d'un adversaire…";

  const statusBlock = (
    <div className="flex flex-col items-center gap-3.5 text-center">
      <WaitingTopic topic={topic} size={56} />
      <WaitingStatusPill label={label} />
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
        <span
          className="flex items-center gap-1.5"
          style={{ color: TOKEN.mutedFg, fontSize: 11.5 }}
        >
          <Swords size={12} /> {nominative ? "Défi nominatif" : "Salon privé"}
        </span>
        {expiresAt && (
          <span
            className="flex items-center gap-1.5"
            style={{ color: TOKEN.mutedFg, fontSize: 11.5 }}
          >
            <Clock size={12} /> Expire dans {timeLeftLabel(expiresAt)}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${TOKEN.secondary} 1.4px, color-mix(in srgb, ${TOKEN.secondary} 0%, transparent) 1.4px)`,
          backgroundSize: "13px 13px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 42%, #000 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 42%, #000 40%, transparent 100%)",
        }}
      />

      <div className="relative flex-1 overflow-y-auto overscroll-y-contain">
        <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-6">
          {nominative ? (
            <div className="relative grid place-items-center">
              <span
                className="qu-halo col-start-1 row-start-1 size-[220px] place-self-center rounded-full"
                style={{
                  background: `radial-gradient(circle, color-mix(in srgb, ${TOKEN.primary} 26%, transparent), color-mix(in srgb, ${TOKEN.primary} 0%, transparent) 70%)`,
                }}
              />
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="qu-ping col-start-1 row-start-1 size-[132px] place-self-center rounded-full"
                  style={{
                    border: `1.5px solid ${TOKEN.primary}`,
                    animationDelay: `${index * 0.8}s`,
                  }}
                />
              ))}
              <UserAvatar
                name={opponent?.pseudonym ?? "Adversaire"}
                userId={opponent?.userId}
                avatarOptions={opponent?.avatarOptions ?? undefined}
                size={96}
                className="relative z-10 col-start-1 row-start-1"
              />
            </div>
          ) : (
            <>
              {statusBlock}
              {children}
            </>
          )}
        </div>
      </div>

      {nominative && <div className="relative pb-8">{statusBlock}</div>}
    </div>
  );
}
