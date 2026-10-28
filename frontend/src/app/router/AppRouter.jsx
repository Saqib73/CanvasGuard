import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../../components/layout/AppLayout";
import ArtistSetupForm from "../../features/auth/pages/ArtistSetupPage";
import Login from "../../features/auth/pages/LoginPage";
import CommunitiesPage from "../../features/communities/pages/CommunitiesPage";
import CommunityPage from "../../features/communities/pages/CommunityPage";
import CreateCommunityPage from "../../features/communities/pages/CreateCommunityPage";
import CommissionsPage from "../../features/commissions/pages/CommissionsPage";
import CommissionDetailsPage from "../../features/commissions/pages/CommissionDetailsPage";
import CommissionRequestsPage from "../../features/commissions/pages/CommissionRequestsPage";
import NotificationsPage from "../../features/notifications/pages/NotificationsPage";
import ExplorePage from "../../features/explore/pages/ExplorePage";
import PromptsPage from "../../features/prompts/pages/PromptsPage";
import ReportPage from "../../features/reports/pages/ReportPage";
import SettingsPage from "../../features/settings/pages/SettingsPage";
import PostDetail from "../../features/posts/components/PostDetail";
import HomePage from "../../features/posts/pages/HomePage";
import CreatePostPage from "../../features/posts/pages/CreatePostPage";
import EditProfilePage from "../../features/profiles/pages/EditProfilePage";
import ProfilePage from "../../features/profiles/pages/ProfilePage";

export function AppRouter({ user, artistSetupPending }) {
  const authenticatedApp = user && !artistSetupPending;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={artistSetupPending ? "/setup" : "/"} /> : <Login />}
      />
      <Route
        path="/setup"
        element={artistSetupPending ? <ArtistSetupForm /> : <Navigate to="/login" />}
      />
      <Route
        path="/*"
        element={
          authenticatedApp ? (
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/post" element={<CreatePostPage />} />
                <Route path="/post/:postId" element={<PostDetail />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/prompts" element={<PromptsPage />} />
                <Route path="/communities" element={<CommunitiesPage />} />
                <Route path="/communities/:id" element={<CommunityPage />} />
                <Route path="/commissions" element={<CommissionsPage />} />
                <Route path="/commissions/:id" element={<CommissionDetailsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/edit-profile" element={<EditProfilePage />} />
                <Route path="/artist/:userName" element={<ProfilePage />} />
                <Route path="/report-art" element={<ReportPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/commissionRequests" element={<CommissionRequestsPage />} />
                <Route path="/createCommunity" element={<CreateCommunityPage />} />
              </Routes>
            </AppLayout>
          ) : (
            <Navigate to={artistSetupPending ? "/setup" : "/login"} />
          )
        }
      />
    </Routes>
  );
}

function Gallery() {
  return <div className="p-4">Gallery</div>;
}

export default AppRouter;
