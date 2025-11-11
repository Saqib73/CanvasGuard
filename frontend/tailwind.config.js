import daisyui from "daisyui";
import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "cg-bg": "rgb(var(--cg-bg))",
        "cg-card": "rgb(var(--cg-card))",
        "cg-muted": "rgb(var(--cg-muted))",
        "cg-primary": "rgb(var(--cg-primary))",
        "cg-accent": "rgb(var(--cg-accent))",
        "cg-text": "rgb(var(--cg-text))",
        neutral: colors.neutral,
      },
    },
  },
  daisyui: {
    themes: false,
  },
  plugins: [daisyui],
};
