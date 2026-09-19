import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { initSession } from "@/lib/auth";
import { useSessionStore } from "@/features/auth/stores/useSessionStore";
import { initTheme, useThemeStore } from "@/features/shell/stores/useThemeStore";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ErrorToasterBridge } from "@/shared/components/ErrorToasterBridge";
import { PresenceConnection } from "@/shared/components/PresenceConnection";
import { AppRoutes } from "@/routes";

const queryClient = createQueryClient();

export function App() {
  const ready = useSessionStore((s) => s.ready);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    initTheme();
    initSession()
      .then((user) => useSessionStore.getState().setSession(!!user))
      .finally(() => useSessionStore.getState().setReady());
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </BrowserRouter>
      <Toaster theme={theme} />
      <ErrorToasterBridge />
      <PresenceConnection />
    </QueryClientProvider>
  );
}

export default App;
