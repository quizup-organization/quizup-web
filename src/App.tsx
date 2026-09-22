import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { AuthProvider } from "@/features/auth/providers/AuthProvider";
import { useAuth } from "@/features/auth/providers/auth-context";
import { ThemeProvider } from "@/features/shell/providers/ThemeProvider";
import { useTheme } from "@/features/shell/providers/theme-context";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ErrorToasterBridge } from "@/shared/components/ErrorToasterBridge";
import { PresenceConnection } from "@/shared/components/PresenceConnection";
import { AppRoutes } from "@/routes";

const queryClient = createQueryClient();

function AppToaster() {
  const { resolvedTheme } = useTheme();
  return <Toaster theme={resolvedTheme} />;
}

function AppContent() {
  const { ready } = useAuth();

  if (!ready) {
    return (
      <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <AppToaster />
      <ErrorToasterBridge />
      <PresenceConnection />
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
