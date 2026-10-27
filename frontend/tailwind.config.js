import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "cg-bg": "rgb(var(--cg-bg) / <alpha-value>)",
        "cg-card": "rgb(var(--cg-card) / <alpha-value>)",
        "cg-muted": "rgb(var(--cg-muted) / <alpha-value>)",
        "cg-primary": "rgb(var(--cg-primary) / <alpha-value>)",
        "cg-accent": "rgb(var(--cg-accent) / <alpha-value>)",
        "cg-text": "rgb(var(--cg-text) / <alpha-value>)",
      },
    },
  },
  daisyui: {
    themes: [
      {
        "canvasguard-dark": {
          primary: "#38bdf8",
          secondary: "#facc15",
          accent: "#a78bfa",
          neutral: "#27272a",
          "base-100": "#09090b",
          "base-200": "#18181b",
          "base-300": "#27272a",
          "base-content": "#f4f4f5",
          info: "#38bdf8",
          success: "#34d399",
          warning: "#fbbf24",
          error: "#fb7185",
        },
      },
      {
        "canvasguard-light": {
          primary: "#0284c7",
          secondary: "#ca8a04",
          accent: "#7c3aed",
          neutral: "#3f3f46",
          "base-100": "#ffffff",
          "base-200": "#f4f4f5",
          "base-300": "#e4e4e7",
          "base-content": "#18181b",
          info: "#0284c7",
          success: "#059669",
          warning: "#d97706",
          error: "#e11d48",
        },
      },
    ],
  },
  plugins: [daisyui],
};
