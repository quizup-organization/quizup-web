import { Hammer } from "lucide-react";
import { Chip } from "@heroui/react";

/**
 * Pastille « À construire » (Chip HeroUI).
 * Convention : toute fonctionnalité de product/features.md non exposée par un service est
 * marquée avec ce tag + un commentaire JSDoc `[À CONSTRUIRE]`.
 */
export function ToBuildTag({ label = "À construire" }: { label?: string }) {
    return (
        <Chip size="sm" variant="soft" className="gap-1 border border-warning/40 text-warning">
            <Hammer /> {label}
        </Chip>
    );
}
