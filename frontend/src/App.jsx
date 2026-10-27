import { StoreProvider } from "./app/store/store";
import { useCurrentUser } from "./features/auth/api/auth.hooks";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./socket";
import PageLoader from "./components/ui/PageLoader";
import { AppRouter } from "./app/router/AppRouter";

export default function App() {
  const { data: currentUser, isLoading: isAuthLoading, isError: isAuthError } = useCurrentUser();
  const user = isAuthError ? null : currentUser;
  const artistSetupPending = Boolean(user?.isArtist && !user?.artistProfile);

  if (isAuthLoading) return <PageLoader />;

  return (
    <SocketProvider>
      <StoreProvider>
        <AppRouter user={user} artistSetupPending={artistSetupPending} />
        <Toaster />
      </StoreProvider>
    </SocketProvider>
  );
}
