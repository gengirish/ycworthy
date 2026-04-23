import type { Config } from "tailwindcss";

/**
 * "Editorial AI" theme — sophisticated dark editorial palette.
 * Palette inspired by FT.com / Stratechery / The Information — paper-warm
 * off-white text on warm charcoals, with a single piercing vermilion accent
 * that is deliberately distinct from every grade hex (no more brand/data
 * collision the way #FFE048 used to clash with grade-B).
 *
 * Generated via the ui-ux-pro-max design-system reasoning engine for the
 * "AI startup evaluator / editorial scorecard" product profile.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        yc: {
          // Warm near-blacks (slightly warmer than pure #000 — paper feel)
          bg: "#0A0A0B",
          surface: "#111114",
          "surface-2": "#17171C",
          border: "#23232B",
          "border-light": "#33333D",

          // Editorial Vermilion — FT-coded, instantly distinct from any grade
          // hex. Nothing in `grade.*` lives in this hue range.
          accent: "#FF6A2A",
          "accent-soft": "#FF8A55",
          "accent-deep": "#D9521A",

          // Paper-warm off-white (not clinical #FFFFFF / #E8E8E8)
          text: "#ECEAE3",
          muted: "#5A5A60",
          dim: "#8A8682",
        },
        grade: {
          // S/A unchanged — high-vibrancy success greens read perfectly on warm dark
          s: "#00FFB2",
          a: "#7CFF6B",
          // B was #FFE048 — clashed with the old brand accent. Switched to a
          // calmer editorial amber that doesn't collide with the new vermilion
          // brand accent either.
          b: "#F4B942",
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
        // Body / UI — Geist Sans (Vercel's 2026 system; supersedes DM Sans
        // for a slightly more refined, less generic-startup feel).
        sans: [
          "'Geist'",
          "'DM Sans'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        // Display / headlines — Fraunces (variable serif w/ optical sizing).
        // This is the heart of the editorial pivot: a magazine-headline serif
        // for "YCWorthy", company names, and the YC partner verdict pull-quote.
        display: [
          "'Fraunces'",
          "'Playfair Display'",
          "Georgia",
          "ui-serif",
          "serif",
        ],
        // Editorial italic body (verdicts, taglines)
        serif: [
          "'Fraunces'",
          "Georgia",
          "'Times New Roman'",
          "ui-serif",
          "serif",
        ],
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
        // Vermilion-tinted glow (was yellow)
        glowPulse: {
          "0%": { boxShadow: "0 0 20px rgba(255, 106, 42, 0.18)" },
          "100%": { boxShadow: "0 0 40px rgba(255, 106, 42, 0.45)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        // Subtler editorial grid (warm white at 1% — was 1.6%)
        grid: "linear-gradient(rgba(236,234,227,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(236,234,227,0.012) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "80px 80px",
      },
    },
  },
  plugins: [],
};

export default config;
