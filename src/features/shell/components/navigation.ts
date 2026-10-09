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
 * vit dans l'inbox. L'atelier d'auteur (création, brouillons, gestion) vit dans la page
 * Sujets, onglet « Mes sujets » (`/topics?mine=true`) — pas d'entrée de nav dédiée.
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

/**
 * Règle d'activité d'une entrée de nav, partagée par la sidebar et la bottom nav.
 * `Sujets` couvre le catalogue, les fiches et l'atelier d'auteur (`/topics/new|mine`,
 * `/topics/:id/manage`).
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.path === "/") {
    return pathname === "/";
  }
  if (item.id === "topics") {
    return pathname === "/topics" || pathname.startsWith("/topics/");
  }
  // La fiche joueur (`/players/:id`) appartient à l'univers Personnes.
  if (item.id === "people") {
    return pathname.startsWith("/people") || pathname.startsWith("/players");
  }
  // Le profil couvre aussi Réglages (même univers côté joueur).
  if (item.id === "profile") {
    return pathname.startsWith("/profile") || pathname.startsWith("/settings");
  }
  return pathname.startsWith(item.path);
}
