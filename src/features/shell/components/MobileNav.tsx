import { NavLink } from "react-router-dom";
import { MOBILE_NAV } from "./navigation";
import { cn } from "@/lib/utils";

/** Barre de navigation basse (mobile uniquement). */
export function MobileNav() {
  return (
    <nav className="flex h-[58px] shrink-0 items-stretch border-t bg-sidebar md:hidden">
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground",
                isActive && "text-primary",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} />
                <span
                  className={cn(
                    "text-[10.5px]",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
