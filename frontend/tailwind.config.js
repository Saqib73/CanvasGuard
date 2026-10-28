import daisyui from "daisyui";

// Colors live in src/theme/tokens.css; this only maps them to class names.
const token = (name) => `rgb(var(--cg-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "cg-bg": token("bg"),
        "cg-surface": token("surface"),
        "cg-hover": token("hover"),
        "cg-border": token("border"),
        "cg-card": token("card"),
        "cg-muted": token("muted"),
        "cg-primary": token("primary"),
        "cg-accent": token("accent"),
        "cg-text": token("text"),
      },
    },
  },
  plugins: [daisyui],
};
