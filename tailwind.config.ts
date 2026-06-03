import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        night: "#070A12",
        panel: "rgba(15, 23, 42, 0.72)",
        line: "rgba(148, 163, 184, 0.18)"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(56, 189, 248, 0.14)",
        soft: "0 16px 60px rgba(0, 0, 0, 0.34)"
      }
    }
  },
  plugins: []
};

export default config;
