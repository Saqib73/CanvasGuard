import { useState } from "react";

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const settingsCategories = [
    { name: "Your account", path: "/settings/account" },
    { name: "Security and account access", path: "/settings/security" },
    { name: "Privacy and safety", path: "/settings/privacy" },
    { name: "Notifications", path: "/settings/notifications" },
    { name: "Accessibility, display, and languages", path: "/settings/accessibility" },
    { name: "Additional resources", path: "/settings/resources" },
  ];

  const filteredCategories = settingsCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="sticky top-0 z-10 backdrop-blur bg-base-100/80 border-b border-base-300 p-4 font-semibold text-lg">
        Settings
      </div>
      <div className="p-6 space-y-4 max-w-2xl">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Settings"
            className="w-full pl-10 pr-4 py-3 bg-base-200 border border-base-300 rounded-full outline-none focus:border-primary text-base-content"
          />
        </div>

        {/* Settings Categories */}
        <div className="space-y-1">
          {filteredCategories.map((category, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between p-4 hover:bg-base-200 rounded-2xl transition-colors text-base-content"
            >
              <span className="text-left font-medium">{category.name}</span>
              <svg
                className="h-5 w-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          ))}
        </div>

        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-8 text-neutral-400">
            No settings found for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
}

export const Settings = SettingsPage;
