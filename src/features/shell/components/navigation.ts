import {
  Home,
  Search,
  Swords,
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
 * Navigation latérale : Accueil, Sujets, Personnes, Défis.
 */
export const NAV: NavItem[] = [
  { id: "home", label: "Accueil", path: "/", icon: Home },
  { id: "topics", label: "Sujets", path: "/topics", icon: Search },
  { id: "people", label: "Personnes", path: "/people", icon: Users },
  { id: "challenges", label: "Défis", path: "/challenges", icon: Swords },
];

/** Barre basse mobile : Accueil, Sujets, Personnes, Profil. */
export const MOBILE_NAV: NavItem[] = [
  { id: "home", label: "Accueil", path: "/", icon: Home },
  { id: "topics", label: "Sujets", path: "/topics", icon: Search },
  { id: "people", label: "Personnes", path: "/people", icon: Users },
  { id: "profile", label: "Profil", path: "/profile", icon: UserRound },
];
