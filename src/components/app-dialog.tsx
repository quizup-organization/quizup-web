import type { ReactNode } from "react";
import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Dialog applicatif — enveloppe le `Dialog` shadcn natif (titre / description / footer).
 * Remplace l'ancienne émulation `Modal`.
 */
interface AppDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    sub?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    showCloseButton?: boolean;
}

export function AppDialog({ open, onClose, title, sub, children, footer, className, showCloseButton = true }: AppDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            <DialogContent className={cn("max-h-[85vh] overflow-y-auto", className)} showCloseButton={showCloseButton}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {sub && <DialogDescription>{sub}</DialogDescription>}
                </DialogHeader>
                {children}
                {footer && <DialogFooter>{footer}</DialogFooter>}
            </DialogContent>
        </Dialog>
    );
}
