import type { ReactNode } from "react";
import { MotionConfig, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const LABEL_WIDTH = 72;

export interface BottomNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Badge optionnel (compteur de non-lues…) rendu en pastille sur l'icône. */
  badge?: ReactNode;
}

interface BottomNavBarProps {
  items: BottomNavItem[];
  /** Id de l'onglet actif (dérivé de la route par le conteneur). */
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Masquée pendant le scroll vers le bas (glisse hors écran). */
  hidden?: boolean;
  className?: string;
}

/**
 * Barre de navigation basse mobile — adaptée du composant 21st.dev « bottom-nav-bar »
 * (Arunachalam). Pastille flottante en verre dépoli, onglet actif qui déploie son libellé
 * (framer-motion). Purement présentationnel : état actif et navigation fournis par le conteneur.
 */
export function BottomNavBar({
  items,
  activeId,
  onSelect,
  hidden = false,
  className,
}: BottomNavBarProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.nav
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: hidden ? 0 : 1,
          y: hidden ? 96 : 0,
        }}
        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
        role="navigation"
        aria-label="Navigation principale"
        aria-hidden={hidden}
        className={cn(
          "fixed inset-x-0 bottom-[var(--bottom-nav-offset)] z-30 mx-auto flex h-14 w-fit max-w-[95vw] min-w-[320px] items-center gap-0.5 rounded-full border border-border/60 bg-card/70 p-1.5 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-card/60 md:hidden",
          hidden && "pointer-events-none",
          className,
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex h-11 min-h-11 min-w-10 items-center rounded-full px-2 py-2 transition-colors duration-200",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                isActive
                  ? "gap-2 bg-primary/10 text-primary"
                  : "bg-transparent text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={2} aria-hidden />
                {item.badge}
              </span>

              <motion.div
                initial={false}
                animate={{
                  width: isActive ? `${LABEL_WIDTH}px` : "0px",
                  opacity: isActive ? 1 : 0,
                }}
                transition={{
                  // Tween sans rebond : les onglets voisins glissent sans « jingle ».
                  type: "tween",
                  duration: 0.22,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="flex max-w-[72px] items-center overflow-hidden"
              >
                <span
                  title={item.label}
                  className={cn(
                    "overflow-hidden text-xs leading-[1.9] font-medium text-ellipsis whitespace-nowrap select-none",
                    isActive ? "text-primary" : "opacity-0",
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </motion.button>
          );
        })}
      </motion.nav>
    </MotionConfig>
  );
}
