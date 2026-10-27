import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { applyTheme, getStoredTheme } from "./theme/ThemeProvider.jsx";
import { AppProviders } from "./app/providers/AppProviders.jsx";

// Apply the saved theme before React mounts so the loader never flashes the wrong palette.
applyTheme(getStoredTheme());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>
);
