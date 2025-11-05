import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "./store.jsx";
import Home from "./pages/Home";
import PostPage from "./pages/Post";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ExplorePage from "./pages/Explore";
import PromptsPage from "./pages/Prompts";
import Communities from "./pages/Communities";
import Commissions from "./pages/Commissions";
import Settings from "./pages/Settings";
import { Layout } from "./layout/Layout.jsx";
import Login from "./pages/Login/Login.jsx";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { userExists, userNotExists } from "./redux/reducers/auth.js";
import axios from "axios";
import { Toaster } from "react-hot-toast";

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

export default function App() {
  const { user } = useSelector((state) => state.auth);
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
      .catch((err) => dispatch(userNotExists()));
  }, [dispatch]);
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
                  <Route path="/artist/:id" element={<Profile />} />
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

function ThemeToggle() {
  const { theme, toggleTheme } = useStore();

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="p-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 flex items-center justify-center"
    >
      <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
