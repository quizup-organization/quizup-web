import type { LucideIcon } from "lucide-react"
import { cn } from "cn"
import { UserAvatar } from "./user-avatar"

interface ToastCardProps {
  title: string
  description?: string | null
  /** Ton coloré (issue d'un défi, erreur…). */
  tone?: "success" | "danger" | null
  /** Acteur : son **avatar** remplace l'icône (présence, abonnement…). */
  actor?: { userId: string; name: string; avatarOptions?: string | null } | null
  /** Icône du gabarit quand il n'y a pas d'acteur (type de notification). */
  icon?: LucideIcon
  onClick?: () => void
}

/**
 * **Gabarit unique des toasts** : un visuel de tête (avatar de l'acteur, sinon l'icône du type
 * dans une pastille teintée), un titre et une description — même densité pour tous (présence,
 * abonnement, défi tranché, salon…), au lieu de certains toasts réduits à une ligne.
 */
export function ToastCard({
  title,
  description,
  tone = null,
  actor = null,
  icon: Icon,
  onClick,
}: ToastCardProps) {
  const Wrapper = onClick ? "button" : "div"

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "flex w-full items-start gap-3 text-left",
        onClick && "cursor-pointer"
      )}
    >
      {actor ? (
        <UserAvatar
          name={actor.name}
          userId={actor.userId}
          avatarOptions={actor.avatarOptions ?? undefined}
          size={32}
        />
      ) : Icon ? (
        <span
          className={cn(
            "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
            tone === "success" && "bg-toast-success/15 text-toast-success",
            tone === "danger" && "bg-toast-danger/15 text-toast-danger",
            !tone && "bg-muted text-muted-foreground"
          )}
          aria-hidden
        >
          <Icon className="size-4" />
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span
          className={cn(
            "text-sm leading-5 font-medium",
            tone === "success" && "text-toast-success",
            tone === "danger" && "text-toast-danger"
          )}
        >
          {title}
        </span>
        {description && (
          <span className="text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </Wrapper>
  )
}
