import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/features/shell";
import { RequireAuth } from "./RequireAuth";

/**
 * Routes chargées à la demande : chaque page est un chunk séparé, le shell reste eager.
 * Les features sont importées via leur API publique (barrel `@/features/<nom>`).
 */
const HomePage = lazy(() =>
  import("@/features/home/pages").then((m) => ({ default: m.HomePage })),
);
const TopicsPage = lazy(() =>
  import("@/features/topics/pages").then((m) => ({ default: m.TopicsPage })),
);
const TopicDetailPage = lazy(() =>
  import("@/features/topic/pages").then((m) => ({ default: m.TopicDetailPage })),
);
const ProfilePage = lazy(() =>
  import("@/features/shell/pages").then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("@/features/shell/pages").then((m) => ({ default: m.SettingsPage })),
);
const PeoplePage = lazy(() =>
  import("@/features/people/pages").then((m) => ({ default: m.PeoplePage })),
);
const PlayerProfilePage = lazy(() =>
  import("@/features/player/pages").then((m) => ({ default: m.PlayerProfilePage })),
);
const ChallengesPage = lazy(() =>
  import("@/features/challenges/pages").then((m) => ({ default: m.ChallengesPage })),
);
const ChallengeLobbyPage = lazy(() =>
  import("@/features/challenges/pages").then((m) => ({
    default: m.ChallengeLobbyPage,
  })),
);
const DuelPage = lazy(() =>
  import("@/features/duel/pages").then((m) => ({ default: m.DuelPage })),
);
const MatchmakingPage = lazy(() =>
  import("@/features/duel/pages").then((m) => ({ default: m.MatchmakingPage })),
);
const LoginPage = lazy(() =>
  import("@/features/auth/pages").then((m) => ({ default: m.LoginPage })),
);
const VerifyCodePage = lazy(() =>
  import("@/features/auth/pages").then((m) => ({ default: m.VerifyCodePage })),
);
const CallbackPage = lazy(() =>
  import("@/features/auth/pages").then((m) => ({ default: m.CallbackPage })),
);

function RouteFallback() {
  return (
    <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">
      Chargement…
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/code" element={<VerifyCodePage />} />
        <Route path="/callback" element={<CallbackPage />} />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/topics/:topicId" element={<TopicDetailPage />} />
          <Route path="/duel/:gameId" element={<DuelPage />} />
          <Route path="/duel/search/:ticketId" element={<MatchmakingPage />} />
          <Route
            path="/challenges/:challengeId"
            element={<ChallengeLobbyPage />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/players/:playerId" element={<PlayerProfilePage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
