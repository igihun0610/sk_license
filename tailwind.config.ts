import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          dark: "#0a0a1a",
          navy: "#0d1b2a",
          purple: "#1b1464",
          gold: "#ffd700",
          star: "#f0f0ff",
        },
      },
      backgroundImage: {
        "space-gradient": "linear-gradient(180deg, #0d1b2a 0%, #1b1464 50%, #2d1b69 100%)",
      },
      fontFamily: {
        space: ["var(--font-space)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
