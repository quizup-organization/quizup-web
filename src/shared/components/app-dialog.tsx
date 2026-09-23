import type { ReactNode } from "react";
import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Dialog applicatif — enveloppe le `Dialog` shadcn natif (titre / description / footer).
 * Remplace l'ancienne émulation `Modal`.
 *
 * `sticky` : header et footer restent visibles, seul le corps défile (`DialogStickyFooter`).
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
    sticky?: boolean;
}

export function AppDialog({
    open,
    onClose,
    title,
    sub,
    children,
    footer,
    className,
    showCloseButton = true,
    sticky = false,
}: AppDialogProps) {
    if (sticky) {
        return (
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (!next) onClose();
                }}
            >
                <DialogContent
                    className={cn("flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0", className)}
                    showCloseButton={showCloseButton}
                >
                    <DialogHeader className="shrink-0 gap-1.5 border-b px-6 py-4 pr-14">
                        <DialogTitle>{title}</DialogTitle>
                        {sub && <DialogDescription>{sub}</DialogDescription>}
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
                    {footer && (
                        <DialogFooter className="shrink-0 border-t bg-popover px-6 py-4">
                            {footer}
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        );
    }

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
