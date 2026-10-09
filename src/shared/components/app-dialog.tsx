import type { ReactNode } from "react";
import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Dialog applicatif — enveloppe le `Dialog` shadcn natif (titre / description / footer).
 * L'en-tête et les actions restent toujours visibles : seul le corps défile.
 */
interface AppDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    sub?: string;
    /** Barre fixe (recherche, filtres…) entre l'en-tête et le corps scrollable. */
    toolbar?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    /** Classes additionnelles du corps scrollable (ex. `flex flex-col`). */
    bodyClassName?: string;
    /** Classes additionnelles du footer (ex. `compact:flex-row`). */
    footerClassName?: string;
    showCloseButton?: boolean;
}

export function AppDialog({
    open,
    onClose,
    title,
    sub,
    toolbar,
    children,
    footer,
    className,
    bodyClassName,
    footerClassName,
    showCloseButton = true,
}: AppDialogProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
        >
            <DialogContent
                className={cn("flex max-h-[min(85dvh,var(--vvh,100dvh))] flex-col gap-0 overflow-hidden p-0", className)}
                showCloseButton={showCloseButton}
            >
                <DialogHeader className="shrink-0 gap-1.5 border-b px-6 py-4 pr-14">
                    <DialogTitle>{title}</DialogTitle>
                    {sub && <DialogDescription>{sub}</DialogDescription>}
                </DialogHeader>
                {toolbar && (
                    <div className="shrink-0 border-b bg-popover px-6 py-3">{toolbar}</div>
                )}
                <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-5", bodyClassName)}>
                    {children}
                </div>
                {footer && (
                    <DialogFooter
                        className={cn("shrink-0 border-t bg-popover px-6 py-4", footerClassName)}
                    >
                        {footer}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
