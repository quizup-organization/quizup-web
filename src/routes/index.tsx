import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Zap } from "lucide-react";
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
const CreateTopicPage = lazy(() =>
  import("@/features/topic-authoring/pages").then((m) => ({
    default: m.CreateTopicPage,
  })),
);
const TopicManagePage = lazy(() =>
  import("@/features/topic-authoring/pages").then((m) => ({
    default: m.TopicManagePage,
  })),
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
const AvatarEditorPage = lazy(() =>
  import("@/features/shell/pages").then((m) => ({ default: m.AvatarEditorPage })),
);
const PeoplePage = lazy(() =>
  import("@/features/people/pages").then((m) => ({ default: m.PeoplePage })),
);
const PlayerProfilePage = lazy(() =>
  import("@/features/player/pages").then((m) => ({ default: m.PlayerProfilePage })),
);
const NotificationsPage = lazy(() =>
  import("@/features/notifications/pages").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const RoomPage = lazy(() =>
  import("@/features/game/pages").then((m) => ({ default: m.RoomPage })),
);
const JoinRoomPage = lazy(() =>
  import("@/features/game/pages").then((m) => ({ default: m.JoinRoomPage })),
);
const GamePage = lazy(() =>
  import("@/features/game/pages").then((m) => ({ default: m.GamePage })),
);
const GameResultPage = lazy(() =>
  import("@/features/game/pages").then((m) => ({ default: m.GameResultPage })),
);
const MatchmakingPage = lazy(() =>
  import("@/features/game/pages").then((m) => ({ default: m.MatchmakingPage })),
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
    <div className="grid min-h-svh place-items-center">
      <div className="flex flex-col items-center gap-3">
        <div className="grid size-14 place-items-center rounded-full bg-foreground text-background motion-safe:animate-pulse">
          <Zap className="size-6 fill-current" strokeWidth={0} />
        </div>
        <p className="font-heading text-sm font-semibold">QuizUp</p>
      </div>
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
          <Route path="/topics/new" element={<CreateTopicPage />} />
          <Route path="/topics/:topicId/manage" element={<TopicManagePage />} />
          <Route path="/topics/:topicId" element={<TopicDetailPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/game/:gameId/result" element={<GameResultPage />} />
          <Route path="/matchmaking/:ticketId" element={<MatchmakingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/rooms/:roomId" element={<RoomPage />} />
          <Route path="/join/:roomId" element={<JoinRoomPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/avatar" element={<AvatarEditorPage />} />
          <Route path="/people" element={<PeoplePage />} />
          <Route path="/players/:playerId" element={<PlayerProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
