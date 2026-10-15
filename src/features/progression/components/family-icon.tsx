import {
  CalendarCheck,
  Compass,
  Eye,
  Flame,
  Gauge,
  GraduationCap,
  Megaphone,
  Swords,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { BadgeFamily } from "../domain/progression"

/** Icône d'une famille de badges (médailles de la collection et des célébrations). */
export const FAMILY_ICONS: Record<BadgeFamily, LucideIcon> = {
  VOLUME: Swords,
  MASTERY: GraduationCap,
  EXPLOIT: Flame,
  SERIES: Flame,
  ASSIDUITY: CalendarCheck,
  SOCIAL: Users,
  CHALLENGES: Megaphone,
  VISION: Eye,
  PRECISION: Target,
  SPEED: Gauge,
  EXPLORATION: Compass,
  COLLECTION: Trophy,
}
