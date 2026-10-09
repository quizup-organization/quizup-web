import { useEffect, useState, type ReactNode } from "react"
import { Check, Clock, UserPlus, Zap } from "lucide-react"
import { cn } from "cn"
import { UserAvatar } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { waitingStatusLabel } from "../domain/lobby"
import { WaitingStatusPill } from "./WaitingStatusPill"
import { WaitingTopic } from "./WaitingTopic"

/** Un joueur de la salle : identité + présence temps réel (entré dans la salle ou non). */
export interface LobbySlot {
  name: string
  userId?: string
  avatarOptions?: string | null
  present: boolean
  isMe?: boolean
}

interface LobbyWaitingScreenProps {
  topic: {
    name: string
    emoji?: string
    color?: string
    imageUrl?: string
    category?: string | null
    categoryLabel?: string | null
  }
  /** Le joueur courant (toujours affiché à gauche). */
  player: LobbySlot
  /** L'adversaire ; `null` tant qu'aucun second joueur (salon partagé). */
  opponent: LobbySlot | null
  expiresAt?: string | null
  /** Fin du compte à rebours de lancement (les deux joueurs sont présents). */
  readyDeadlineAt?: string | null
  /** Contenu additionnel (partage lien + QR pour un salon non nominatif). */
  children?: ReactNode
}

/** Libellé de temps restant avant expiration (ex. « 41 min »). */
function timeLeftLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return "expiré"
  const minutes = Math.floor(ms / 60_000)
  const days = Math.floor(minutes / (24 * 60))
  if (days >= 1) {
    const hours = Math.floor((minutes % (24 * 60)) / 60)
    return `${days} j ${hours} h`
  }
  if (minutes >= 60) {
    return `${Math.floor(minutes / 60)} h ${(minutes % 60).toString().padStart(2, "0")} min`
  }
  return `${minutes} min`
}

/**
 * Avatar + présence : anneau vert et pastille à coche quand le joueur est dans la salle ; avatar
 * estompé et halos pulsés tant qu'il manque. Le joueur courant est marqué « Toi ».
 */
function PlayerSlot({ slot }: { slot: LobbySlot }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2.5 desktop:w-28">
      <div className="relative grid place-items-center">
        {!slot.present && (
          <>
            {[0, 1].map((index) => (
              <span
                key={index}
                aria-hidden
                className="qu-ping col-start-1 row-start-1 size-[72px] place-self-center rounded-full desktop:size-[96px]"
                style={{
                  border: `1.5px solid ${TOKEN.timer}`,
                  animationDelay: `${index * 0.8}s`,
                }}
              />
            ))}
          </>
        )}
        <span
          className={cn(
            "col-start-1 row-start-1 grid size-[72px] place-items-center rounded-full transition-all duration-300 desktop:size-[96px]",
            !slot.present && "opacity-50 grayscale"
          )}
          style={
            slot.present
              ? { boxShadow: `0 0 0 3px ${TOKEN.correctAccent}` }
              : undefined
          }
        >
          <UserAvatar
            name={slot.name}
            userId={slot.userId}
            avatarOptions={slot.avatarOptions ?? undefined}
            fluid
          />
        </span>
        <span
          className={cn(
            "absolute right-0 bottom-0 grid size-5 place-items-center rounded-full border-2 text-white transition-colors duration-300 desktop:size-6",
            slot.present ? "bg-[var(--duel-correct-accent)]" : "bg-muted"
          )}
          style={{ borderColor: TOKEN.duelBg }}
        >
          {slot.present ? (
            <Check size={11} strokeWidth={3.5} aria-hidden />
          ) : (
            <Clock size={10} className="text-muted-foreground" aria-hidden />
          )}
        </span>
      </div>
      <span
        className={cn(
          "max-w-full truncate text-xs",
          slot.present ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {slot.isMe ? "Toi" : slot.name}
      </span>
    </div>
  )
}

/** Emplacement vide d'un salon partagé : en attente d'un second joueur. */
function EmptySlot() {
  return (
    <div className="flex w-24 flex-col items-center gap-2.5 desktop:w-28">
      <div
        className="grid size-[72px] place-items-center rounded-full border-2 border-dashed desktop:size-[96px]"
        style={{ borderColor: TOKEN.mutedFg, color: TOKEN.mutedFg }}
      >
        <UserPlus className="size-[26px] desktop:size-8" aria-hidden />
      </div>
      <span className="text-xs text-muted-foreground">Invité</span>
    </div>
  )
}

/**
 * Salle d'attente : les deux avatars face à face avec leur présence temps réel, sujet en tête,
 * état + compte à rebours en pied. Le QR/partage éventuel est fourni en `children`.
 */
export function LobbyWaitingScreen({
  topic,
  player,
  opponent,
  expiresAt,
  readyDeadlineAt,
  children,
}: LobbyWaitingScreenProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    // En phase de lancement on rafraîchit souvent, sinon le libellé d'expiration suffit.
    const interval = setInterval(
      () => setNow(Date.now()),
      readyDeadlineAt ? 250 : 30_000
    )
    return () => clearInterval(interval)
  }, [readyDeadlineAt])

  const readySeconds = readyDeadlineAt
    ? Math.max(0, Math.ceil((new Date(readyDeadlineAt).getTime() - now) / 1000))
    : null

  const bothPresent = player.present && (opponent?.present ?? false)
  // Desktop : partage/QR en colonne de droite quand il y a du contenu additionnel ; sinon la
  // salle reste centrée sur une seule colonne (défi nominatif, pas de partage social).
  const hasAside = Boolean(children)
  const label = waitingStatusLabel({
    readyDeadlineAt: readyDeadlineAt ?? null,
    playerPresent: player.present,
    opponentPresent: opponent?.present ?? false,
    opponentLabel: opponent ? (opponent.isMe ? "toi" : opponent.name) : null,
  })

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
        <div
          className={cn(
            "flex min-h-full flex-col items-center justify-center gap-7 px-6 py-8",
            hasAside &&
              "desktop:grid desktop:h-full desktop:min-h-0 desktop:grid-cols-2 desktop:items-center desktop:gap-12 desktop:px-10 desktop:py-6"
          )}
        >
          <div className="flex flex-col items-center gap-7">
            <WaitingTopic topic={topic} size={56} />

            <div className="flex items-start justify-center gap-4">
              <PlayerSlot slot={player} />
              <div
                className={cn(
                  "mt-4 grid size-9 place-items-center rounded-full border transition-colors duration-300",
                  bothPresent
                    ? "text-[var(--duel-correct-accent)]"
                    : "text-muted-foreground"
                )}
                style={{
                  borderColor: bothPresent ? TOKEN.correctAccent : TOKEN.border,
                }}
                aria-hidden
              >
                <Zap
                  size={16}
                  fill={bothPresent ? TOKEN.correctAccent : "transparent"}
                />
              </div>
              {opponent ? <PlayerSlot slot={opponent} /> : <EmptySlot />}
            </div>

            <div className="flex flex-col items-center gap-3.5 text-center">
              <WaitingStatusPill label={label} />
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
                {readySeconds !== null ? (
                  <span
                    className="flex items-center gap-1.5"
                    style={{ color: TOKEN.mutedFg, fontSize: 11.5 }}
                  >
                    <Clock size={12} /> Départ dans {readySeconds} s
                  </span>
                ) : (
                  expiresAt && (
                    <span
                      className="flex items-center gap-1.5"
                      style={{ color: TOKEN.mutedFg, fontSize: 11.5 }}
                    >
                      <Clock size={12} /> Expire dans {timeLeftLabel(expiresAt)}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {hasAside ? (
            <div className="flex w-full items-center justify-center">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
