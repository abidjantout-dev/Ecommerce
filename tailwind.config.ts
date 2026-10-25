import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nuit: "#0D0F14",
        asphalte: "#161A22",
        bord: "#272D39",
        phare: "#F5C518",
        "phare-sourd": "#C9A015",
        texte: "#EDEFF3",
        "texte-doux": "#9BA3B2",
        vert: "#2FB875",
        rouge: "#E35D4F",
      },
      fontFamily: {
        display: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
        corps: ["Figtree", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
