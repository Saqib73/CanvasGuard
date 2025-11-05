import { NavLink } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen text-cg-text relative overflow-hidden transition-colors duration-200">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-500/5 via-transparent to-yellow-500/5" />
      <div className="mx-auto max-w-7xl grid grid-cols-12 relative h-screen">
        <aside className="col-span-2 border-r border-neutral-300 dark:border-neutral-800 p-4 space-y-6 sticky top-0 h-screen overflow-hidden transition-colors duration-200">
          <div className="px-4 text-xl font-semibold flex items-center justify-center">
            <span className="bg-gradient-to-r from-sky-400 to-yellow-400 bg-clip-text text-transparent">
              CanvasGuard
            </span>
          </div>
          <nav className="flex flex-col gap-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-3 text-base transition-colors duration-200 ${
                  isActive ? "font-semibold" : ""
                }`
              }
            >
              <span>🏠</span>
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                `px-4 py-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-3 text-base transition-colors duration-200 ${
                  isActive ? "font-semibold" : ""
                }`
              }
            >
              <span>🧭</span>
              <span>Explore</span>
            </NavLink>
            <NavLink
              to="/communities"
              className={({ isActive }) =>
                `px-4 py-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-3 text-base transition-colors duration-200 ${
                  isActive ? "font-semibold" : ""
                }`
              }
            >
              <span>👥</span>
              <span>Communities</span>
            </NavLink>
            <NavLink
              to="/commissions"
              className={({ isActive }) =>
                `px-4 py-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-3 text-base transition-colors duration-200 ${
                  isActive ? "font-semibold" : ""
                }`
              }
            >
              <span>👥</span>
              <span>Commissions</span>
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `px-4 py-3 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-3 text-base transition-colors duration-200 ${
                  isActive ? "font-semibold" : ""
                }`
              }
            >
              <span>⚙️</span>
              <span>Settings</span>
            </NavLink>
          </nav>
          <div className="px-4 pt-12">
            <NavLink
              to="/post"
              className="block text-center px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-2xl shadow-lg shadow-yellow-500/20 text-base"
            >
              Post
            </NavLink>
          </div>
        </aside>
        <main className="col-span-7 border-r border-neutral-300 dark:border-neutral-800 h-screen overflow-hidden transition-colors duration-200">
          {children}
        </main>
        <aside className="col-span-3 p-4 sticky top-0 h-screen overflow-hidden">
          <div className="h-full overflow-y-auto no-scrollbar space-y-6">
            <div className="flex justify-end">
              <ThemeToggle />
            </div>
            <div className="cg-card p-5">
              <NavLink
                to="/artist/me"
                className={({ isActive }) =>
                  `flex items-center gap-4 ${
                    isActive ? "opacity-100" : "hover:opacity-90"
                  }`
                }
              >
                <img
                  src="https://ui-avatars.com/api/?name=You&background=111827&color=fff"
                  alt="avatar"
                  className="h-14 w-14 rounded-full ring-2 ring-sky-500/30"
                />
                <div>
                  <div className="font-semibold text-base">You</div>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400">
                    @you
                  </div>
                </div>
              </NavLink>
            </div>

            <input
              className="w-full cg-input py-3 px-4 text-base"
              placeholder="Search CanvasGuard"
            />

            <div className="cg-card p-5">
              <h3 className="font-semibold mb-4 text-xl">Trends for you</h3>
              <ul className="text-base text-neutral-600 dark:text-neutral-300 space-y-4">
                <li className="hover:text-neutral-900 dark:hover:text-white cursor-pointer flex justify-between items-center py-2 transition-colors duration-200">
                  <span className="font-medium">#NoAITraining</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-500">
                    2.1K posts
                  </span>
                </li>
                <li className="hover:text-neutral-900 dark:hover:text-white cursor-pointer flex justify-between items-center py-2 transition-colors duration-200">
                  <span className="font-medium">#WatermarkedOnly</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-500">
                    1.8K posts
                  </span>
                </li>
                <li className="hover:text-neutral-900 dark:hover:text-white cursor-pointer flex justify-between items-center py-2 transition-colors duration-200">
                  <span className="font-medium">#OpenForCollab</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-500">
                    945 posts
                  </span>
                </li>
                <li className="hover:text-neutral-900 dark:hover:text-white cursor-pointer flex justify-between items-center py-2 transition-colors duration-200">
                  <span className="font-medium">#DigitalArt</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-500">
                    5.2K posts
                  </span>
                </li>
                <li className="hover:text-neutral-900 dark:hover:text-white cursor-pointer flex justify-between items-center py-2 transition-colors duration-200">
                  <span className="font-medium">#ArtistRights</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-500">
                    678 posts
                  </span>
                </li>
              </ul>
            </div>

            <div className="cg-card p-5">
              <h3 className="font-semibold mb-4 text-xl">Who to follow</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://ui-avatars.com/api/?name=Art+Master&background=111827&color=fff"
                      alt="avatar"
                      className="h-12 w-12 rounded-full ring-1 ring-neutral-800"
                    />
                    <div>
                      <div className="font-semibold text-base">Art Master</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        @art_master
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-sm font-semibold rounded-full">
                    Follow
                  </button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://ui-avatars.com/api/?name=Pixel+Queen&background=111827&color=fff"
                      alt="avatar"
                      className="h-12 w-12 rounded-full ring-1 ring-neutral-800"
                    />
                    <div>
                      <div className="font-semibold text-base">Pixel Queen</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        @pixel_queen
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-sm font-semibold rounded-full">
                    Follow
                  </button>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://ui-avatars.com/api/?name=Ink+Wizard&background=111827&color=fff"
                      alt="avatar"
                      className="h-12 w-12 rounded-full ring-1 ring-neutral-800"
                    />
                    <div>
                      <div className="font-semibold text-base">Ink Wizard</div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        @ink_wizard
                      </div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-sm font-semibold rounded-full">
                    Follow
                  </button>
                </div>
              </div>
            </div>

            <div className="cg-card p-5">
              <h3 className="font-semibold mb-4 text-xl">Recent Activity</h3>
              <div className="space-y-4 text-base">
                <div className="flex items-start gap-3 py-2">
                  <div className="w-3 h-3 bg-sky-500 rounded-full mt-2"></div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                      @inkfox
                    </span>{" "}
                    liked your post
                    <div className="text-sm text-neutral-500">2m ago</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                      @pixel_painter
                    </span>{" "}
                    reposted your art
                    <div className="text-sm text-neutral-500">15m ago</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                      @aurora_art
                    </span>{" "}
                    started following you
                    <div className="text-sm text-neutral-500">1h ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
