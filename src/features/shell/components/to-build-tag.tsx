import { Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * Pastille « À construire » (composant natif Badge).
 * Convention : toute fonctionnalité de product/features.md non exposée par un service est
 * marquée avec ce tag + un commentaire JSDoc `[À CONSTRUIRE]`.
 */
export function ToBuildTag({ label = "À construire" }: { label?: string }) {
    return (
        <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-500">
            <Hammer /> {label}
        </Badge>
    );
}
