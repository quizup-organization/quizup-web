import {
  Bell,
  Home,
  Search,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"
import type { TranslationKey } from "@/lib/i18n/types"

export interface NavItem {
  id: string
  labelKey: TranslationKey
  path: string
  icon: LucideIcon
}

/**
 * Navigation latérale : Accueil, Sujets, Social, Notifications.
 * Les agrégats éphémères (salons, tickets) ne sont pas consultables : leur trace durable
 * vit dans l'inbox. L'atelier d'auteur (création, brouillons, gestion) vit dans la page
 * Sujets, onglet « Mes sujets » (`/topics?mine=true`) — désactivé pour le MVP
 * (`FEATURE_FLAGS.topicAuthoring`) ; pas d'entrée de nav dédiée.
 */
export const NAV: NavItem[] = [
  { id: "home", labelKey: "shell.nav.home", path: "/", icon: Home },
  { id: "topics", labelKey: "shell.nav.topics", path: "/topics", icon: Search },
  { id: "social", labelKey: "shell.nav.social", path: "/social", icon: Users },
  {
    id: "notifications",
    labelKey: "shell.nav.notifications",
    path: "/notifications",
    icon: Bell,
  },
]

/** Barre basse mobile : Accueil, Sujets, Social, Notifications, Profil. */
export const MOBILE_NAV: NavItem[] = [
  { id: "home", labelKey: "shell.nav.home", path: "/", icon: Home },
  { id: "topics", labelKey: "shell.nav.topics", path: "/topics", icon: Search },
  { id: "social", labelKey: "shell.nav.social", path: "/social", icon: Users },
  {
    id: "notifications",
    labelKey: "shell.nav.notifications",
    path: "/notifications",
    icon: Bell,
  },
  {
    id: "profile",
    labelKey: "shell.nav.profile",
    path: "/profile",
    icon: UserRound,
  },
]

/**
 * Règle d'activité d'une entrée de nav, partagée par la sidebar et la bottom nav.
 * `Sujets` couvre le catalogue, les fiches et l'atelier d'auteur (`/topics/new|mine`,
 * `/topics/:id/manage` — désactivé pour le MVP).
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === "/") {
    return pathname === "/"
  }
  if (item.id === "topics") {
    return pathname === "/topics" || pathname.startsWith("/topics/")
  }
  // La fiche joueur (`/players/:id`) appartient à l'univers Social (abonnements, défis, salons).
  if (item.id === "social") {
    return pathname.startsWith("/social") || pathname.startsWith("/players")
  }
  // Le profil couvre aussi Réglages (même univers côté joueur).
  if (item.id === "profile") {
    return pathname.startsWith("/profile") || pathname.startsWith("/settings")
  }
  return pathname.startsWith(item.path)
}
