import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1f3864",
          50: "#f0f4fa",
          100: "#d9e2f3",
          500: "#1f3864",
          600: "#182d52",
          700: "#122240",
        },
        secondary: {
          DEFAULT: "#2563eb",
          600: "#1d4ed8",
        },
        accent: {
          DEFAULT: "#059669",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
