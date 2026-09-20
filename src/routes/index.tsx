import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/features/shell/components/AppShell";
import { HomePage } from "@/features/home/pages/HomePage";
import { TopicsPage } from "@/features/topics/pages/TopicsPage";
import { TopicDetailPage } from "@/features/topic/pages/TopicDetailPage";
import { ProfilePage } from "@/features/shell/pages/ProfilePage";
import { SettingsPage } from "@/features/shell/pages/SettingsPage";
import { PeoplePage } from "@/features/people/pages/PeoplePage";
import { PlayerProfilePage } from "@/features/player/pages/PlayerProfilePage";
import { ChallengesPage } from "@/features/challenges/pages/ChallengesPage";
import { ChallengeLobbyPage } from "@/features/challenges/pages/ChallengeLobbyPage";
import { DuelPage } from "@/features/duel/pages/DuelPage";
import { MatchmakingPage } from "@/features/duel/pages/MatchmakingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { VerifyCodePage } from "@/features/auth/pages/VerifyCodePage";
import { CallbackPage } from "@/features/auth/pages/CallbackPage";
import { RequireAuth } from "./RequireAuth";

export function AppRoutes() {
  return (
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
        <Route path="/challenges/:challengeId" element={<ChallengeLobbyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/players/:playerId" element={<PlayerProfilePage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
