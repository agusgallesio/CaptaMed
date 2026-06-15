import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaf8",
          100: "#d6f3ee",
          200: "#b0e6df",
          300: "#7dd3c8",
          400: "#48b8ac",
          500: "#2d9d92",
          600: "#217e77",
          700: "#1e6560",
          800: "#1c514e",
          900: "#1b4441",
          950: "#0a2725",
        },
        ink: {
          950: "#0a141d",
          900: "#0f1f2e",
          800: "#16293c",
          700: "#1f364d",
        },
      },
      fontFamily: {
        display: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
