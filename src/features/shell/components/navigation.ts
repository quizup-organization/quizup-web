import {
  Bell,
  Home,
  Search,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

/**
 * Navigation latérale : Accueil, Sujets, Personnes, Notifications.
 * Les agrégats éphémères (salons, tickets) ne sont pas consultables : leur trace durable
 * vit dans l'inbox.
 */
export const NAV: NavItem[] = [
  { id: "home", label: "Accueil", path: "/", icon: Home },
  { id: "topics", label: "Sujets", path: "/topics", icon: Search },
  { id: "people", label: "Personnes", path: "/people", icon: Users },
  { id: "notifications", label: "Notifications", path: "/notifications", icon: Bell },
];

/** Barre basse mobile : Accueil, Sujets, Personnes, Notifications, Profil. */
export const MOBILE_NAV: NavItem[] = [
  { id: "home", label: "Accueil", path: "/", icon: Home },
  { id: "topics", label: "Sujets", path: "/topics", icon: Search },
  { id: "people", label: "Personnes", path: "/people", icon: Users },
  { id: "notifications", label: "Notifications", path: "/notifications", icon: Bell },
  { id: "profile", label: "Profil", path: "/profile", icon: UserRound },
];
