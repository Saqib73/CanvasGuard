import { Routes, Route, Navigate } from "react-router-dom";
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
import { userExists, userNotExists } from "./redux/reducers/auth.js";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import Report from "./pages/Report_Art_Theft/Report.jsx";

export default function App() {
  const { user, loader } = useSelector((state) => state.auth);
  console.log(user);
  const dispatch = useDispatch();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_SERVER}/api/v1/user/me`, {
        withCredentials: true,
      })
      .then(({ data }) => {
        dispatch(userExists(data));
      })
      .catch(() => dispatch(userNotExists()));
  }, [dispatch]);

  if (loader) return <div>Loading...</div>;

  return (
    <StoreProvider>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={"/"} /> : <Login />}
        />
        <Route
          path="/*"
          element={
            user ? (
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
                </Routes>
                {/* <Toaster/> */}
              </Layout>
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
