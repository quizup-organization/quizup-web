import {
  Bell,
  CircleCheck,
  CircleX,
  Swords,
  UserPlus,
  type LucideIcon,
} from "lucide-react"
import type { NotificationType } from "@/shared/types/notifications"

/**
 * Icône du **gabarit de toast** selon le type de notification : le shell visuel est commun à
 * tous les toasts (présence, abonnement, défi tranché, salon), seule l'icône change.
 */
export const TOAST_ICONS: Record<NotificationType, LucideIcon> = {
  FOLLOW: UserPlus,
  CHALLENGE_RECEIVED: Swords,
  CHALLENGE_DECLINED: CircleX,
  ROOM_ACCEPTED: CircleCheck,
}

/** Repli quand un type n'a pas d'icône dédiée. */
export const DEFAULT_TOAST_ICON = Bell
