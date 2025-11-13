import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { StoreProvider } from "./store.jsx";
import Home from "./pages/Home/Home.jsx";
import PostPage from "./pages/CreatePost.jsx";
import PostDetail from "./components/PostDetail";
import Profile from "./pages/Profile/Profile.jsx";
import EditProfile from "./pages/EditProfile";
import ExplorePage from "./pages/Explore";
import PromptsPage from "./pages/Prompts";
import Communities from "./pages/Communities";
import Commissions from "./pages/Commission/Commissions.jsx";
import Settings from "./pages/Settings";
import { Layout } from "./layout/Layout.jsx";
import Login from "./pages/Login/Login.jsx";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import {
  setArtIspending,
  userExists,
  userNotExists,
} from "./redux/reducers/auth.js";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import Report from "./pages/Report_Art_Theft/Report.jsx";
import ArtistSetupForm from "./pages/Login/ArtistSetup.jsx";

export default function App() {
  const { user, loader, artistSetupPending } = useSelector(
    (state) => state.auth
  );
  console.log(user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // const loading = true;
    axios
      .get(`${import.meta.env.VITE_SERVER}/api/v1/user/me`, {
        withCredentials: true,
      })
      .then(({ data }) => {
        console.log(data);
        console.log(data.artistProfile);
        // dispatch(userExists(data));
        if (data.isArtist && !data.artistProfile) {
          console.log("setting artist is pending");
          // dispatch(
          //   userExists({
          //     user: data,
          //     artistPendingSetup: data.isArtist && !data.artistProfile,
          //   })
          // );
          dispatch(setArtIspending(true));
          if (window.location.pathname !== "/setup") {
            console.log(window.location.pathname);
            navigate("/setup");
          }
        } else {
          console.log("setting user");
          dispatch(userExists(data));
        }
      })
      .catch(() => dispatch(userNotExists()));
  }, [dispatch, navigate]);

  if (loader) return <div>Loading...</div>;
  // if (user && artistPendingSetup) return <Navigate to="/setup" />;

  return (
    <StoreProvider>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              artistSetupPending ? (
                <Navigate to="/setup" />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/setup"
          element={
            artistSetupPending ? (
              <ArtistSetupForm />
            ) : (
              <Navigate to={"/login"} />
            )
          }
        />
        <Route
          path="/*"
          element={
            user && !artistSetupPending ? (
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/post" element={<PostPage />} />
                  <Route path="/post/:postId" element={<PostDetail />} />
                  <Route path="/gallery" element={<Gallery />} />
                  <Route path="/prompts" element={<PromptsPage />} />
                  <Route path="/communities" element={<Communities />} />
                  <Route path="/commissions" element={<Commissions />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/artist/:userName" element={<Profile />} />
                  <Route path="/report-art" element={<Report />} />
                  <Route path="/setup" element={<ArtistSetupForm />} />
                </Routes>
                {/* <Toaster/> */}
              </Layout>
            ) : artistSetupPending ? (
              <Navigate to={"/setup"} />
            ) : (
              <Navigate to={"/login"} />
            )
          }
        />
      </Routes>
      <Toaster />
    </StoreProvider>
  );
}

function Explore() {
  return <div className="p-4">Explore</div>;
}
function Upload() {
  return <div className="p-4">Upload</div>;
}
function Gallery() {
  return <div className="p-4">Gallery</div>;
}
function Prompts() {
  return <div className="p-4">Prompts</div>;
}
