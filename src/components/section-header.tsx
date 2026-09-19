import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * En-tête de section — titre + action « Voir tout » (bouton shadcn natif).
 * Remplace les libellés « SEE ALL » des écrans de catalogue.
 */
interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    /** Remplace l'action par défaut (ex. un `<Select>`). */
    children?: ReactNode;
}

export function SectionHeader({ title, actionLabel = "Voir tout", onAction, children }: SectionHeaderProps) {
    return (
        <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-base font-semibold">{title}</h2>
            {children ??
                (onAction && (
                    <Button variant="ghost" size="sm" onClick={onAction}>
                        {actionLabel} <ChevronRight />
                    </Button>
                ))}
        </div>
    );
}
