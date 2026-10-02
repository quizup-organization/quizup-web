import {
  Home,
  Search,
  Swords,
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
 * Navigation latérale : Accueil, Sujets, Personnes, Salons.
 */
export const NAV: NavItem[] = [
  { id: "home", label: "Accueil", path: "/", icon: Home },
  { id: "topics", label: "Sujets", path: "/topics", icon: Search },
  { id: "people", label: "Personnes", path: "/people", icon: Users },
  { id: "lobbies", label: "Salons", path: "/lobbies", icon: Swords },
];

/** Barre basse mobile : Accueil, Sujets, Personnes, Salons (Profil reste via la topbar). */
export const MOBILE_NAV: NavItem[] = [
  { id: "home", label: "Accueil", path: "/", icon: Home },
  { id: "topics", label: "Sujets", path: "/topics", icon: Search },
  { id: "people", label: "Personnes", path: "/people", icon: Users },
  { id: "lobbies", label: "Salons", path: "/lobbies", icon: Swords },
];
