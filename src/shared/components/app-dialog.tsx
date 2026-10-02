import type { ReactNode } from "react";
import { Modal, ScrollShadow } from "@heroui/react";
import { cn } from "cn";

/**
 * Dialog applicatif — enveloppe le `Modal` HeroUI (titre / description / footer).
 * L'en-tête et les actions restent toujours visibles : seul le corps défile.
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
    /** `false` laisse le contenu gérer son propre scroll (ex. éditeur à panneaux). */
    bodyScroll?: boolean;
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
    bodyScroll = true,
}: AppDialogProps) {
    return (
        <Modal.Backdrop
            isOpen={open}
            onOpenChange={(next) => {
                if (!next) onClose();
            }}
            variant="blur"
        >
            <Modal.Container>
                {/* La largeur du Dialog vient de `.modal__dialog--md` : les classes de
                    `className` (ex. `sm:max-w-5xl`) doivent donc viser le Dialog, pas le Container. */}
                <Modal.Dialog
                    className={cn(
                        "flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0",
                        className,
                    )}
                >
                    {showCloseButton && <Modal.CloseTrigger />}
                    <Modal.Header className="shrink-0 gap-1.5 border-b border-separator px-6 py-4 pr-14">
                        <Modal.Heading className="text-base font-semibold">{title}</Modal.Heading>
                        {sub && <p className="text-sm text-muted">{sub}</p>}
                    </Modal.Header>
                    <Modal.Body
                        className={
                            bodyScroll
                                ? "min-h-0 flex-1 p-0"
                                : "flex min-h-0 flex-1 flex-col overflow-hidden p-0"
                        }
                    >
                        {bodyScroll ? (
                            <ScrollShadow orientation="vertical" className="px-6 py-5">
                                {children}
                            </ScrollShadow>
                        ) : (
                            children
                        )}
                    </Modal.Body>
                    {footer && (
                        <Modal.Footer className="shrink-0 border-t border-separator px-6 py-4">
                            {footer}
                        </Modal.Footer>
                    )}
                </Modal.Dialog>
            </Modal.Container>
        </Modal.Backdrop>
    );
}
