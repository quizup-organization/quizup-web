import {
  Bell,
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { UserAvatar } from "./user-avatar"

/** Ton du gabarit : teinte la pastille et le titre (aligné sur les variants du `Toaster`). */
export type ToastTone = "success" | "danger" | "warning" | "info" | null

/** Acteur du toast (présence, abonnement) : son **avatar** remplace l'icône. */
export interface ToastActor {
  userId: string
  name: string
  avatarOptions?: string | null
}

interface ToastCardProps {
  title: string
  /** Toujours **réservée** (hauteur constante des toasts), même sans description. */
  description?: string | null
  tone?: ToastTone
  actor?: ToastActor | null
  /** Icône du gabarit quand il n'y a pas d'acteur ; à défaut, celle du ton. */
  icon?: LucideIcon
  onClick?: () => void
}

/** Icône de tête par ton : aucun toast n'est jamais affiché sans visuel. */
const TONE_ICONS: Record<
  "success" | "danger" | "warning" | "info" | "neutral",
  LucideIcon
> = {
  success: CircleCheck,
  danger: CircleX,
  warning: TriangleAlert,
  info: Info,
  neutral: Bell,
}

/** Pastille du visuel de tête par ton (fond plein teinté, jamais translucide à outrance). */
const TONE_PASTILLE: Record<
  "success" | "danger" | "warning" | "info" | "neutral",
  string
> = {
  success: "bg-toast-success/15 text-toast-success",
  danger: "bg-toast-danger/15 text-toast-danger",
  warning: "bg-toast-warning/15 text-toast-warning",
  info: "bg-toast-accent/15 text-toast-accent",
  neutral: "bg-muted text-muted-foreground",
}

/** Titre teinté par ton (mêmes tons que les variants du `Toaster`). */
const TONE_TITLE: Record<
  "success" | "danger" | "warning" | "info" | "neutral",
  string
> = {
  success: "text-toast-success",
  danger: "text-toast-danger",
  warning: "text-toast-warning",
  info: "text-toast-accent",
  neutral: "",
}

/**
 * **Gabarit unique des toasts** : un visuel de tête **toujours présent** (avatar de l'acteur,
 * sinon la pastille de l'icône du ton — surchargeable), un titre 16 px, une description 14 px
 * dont la ligne est **toujours réservée** (tous les toasts ont la même hauteur), que le toast
 * confirme une action, signale une erreur, porte une notification cliquable ou l'arrivée en
 * ligne d'un joueur. Rendu via `showToast` (`shared/utils/toast.tsx`) — ne pas l'instancier
 * directement hors tests.
 */
export function ToastCard({
  title,
  description,
  tone = null,
  actor = null,
  icon,
  onClick,
}: ToastCardProps) {
  const Wrapper = onClick ? "button" : "div"
  const key = tone ?? "neutral"
  const Icon = icon ?? TONE_ICONS[key]

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
      ) : (
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full",
            TONE_PASTILLE[key]
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
      )}

      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span
          className={cn("text-base leading-6 font-semibold", TONE_TITLE[key])}
        >
          {title}
        </span>
        {/* Ligne **toujours réservée** : même hauteur pour tous les toasts. */}
        <span className="block min-h-5 text-sm leading-5 text-toast-muted">
          {description}
        </span>
      </span>
    </Wrapper>
  )
}
