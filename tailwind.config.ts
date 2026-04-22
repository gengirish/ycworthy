import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        yc: {
          bg: "#080808",
          surface: "#0d0d0d",
          "surface-2": "#121212",
          border: "#1e1e1e",
          "border-light": "#2a2a2a",
          accent: "#FFE048",
          text: "#e8e8e8",
          muted: "#444444",
          dim: "#888888",
        },
        grade: {
          s: "#00FFB2",
          a: "#7CFF6B",
          b: "#FFE048",
          c: "#FF9F43",
          d: "#FF6B6B",
          f: "#FF3860",
        },
        provider: {
          nvidia: "#76B900",
          gemini: "#4A9EFF",
        },
      },
      fontFamily: {
        // Body / UI — recommended by ui-ux-pro-max for tech/AI products
        sans: [
          "'DM Sans'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        // Display / headlines
        display: [
          "'Space Grotesk'",
          "'DM Sans'",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Editorial accent (kept for brand/YC magazine feel where needed)
        serif: ["Georgia", "'Times New Roman'", "serif"],
        mono: [
          "'JetBrains Mono'",
          "'Fira Code'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "'Courier New'",
          "monospace",
        ],
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease both",
        pulse: "pulse 2s ease infinite",
        bounce: "bounce 1.2s ease-in-out infinite",
        "score-fill": "scoreFill 1.3s cubic-bezier(0.22,1,0.36,1)",
        "glow-pulse": "glowPulse 2s ease-in-out infinite alternate",
        shimmer: "shimmer 2.4s linear infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        bounce: {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-10px)", opacity: "1" },
        },
        scoreFill: {
          from: { width: "0%" },
          to: { width: "var(--score-width)" },
        },
        glowPulse: {
          "0%": { boxShadow: "0 0 20px rgba(255, 224, 72, 0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(255, 224, 72, 0.5)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "80px 80px",
      },
    },
  },
  plugins: [],
};

export default config;
