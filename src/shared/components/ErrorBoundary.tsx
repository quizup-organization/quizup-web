import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/** Filet de sécurité UI : évite l'écran blanc en cas d'erreur de rendu. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[UI] Unhandled render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-svh place-items-center bg-background p-6 text-center">
          <div className="flex max-w-md flex-col items-center gap-3">
            <h1 className="font-heading text-xl font-extrabold">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message ?? "Erreur inattendue."}
            </p>
            <Button onClick={() => window.location.reload()}>Recharger</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
