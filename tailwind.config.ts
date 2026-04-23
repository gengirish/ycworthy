import type { Config } from "tailwindcss";

/**
 * "Mission Control" theme — HUD/Sci-Fi FUI × AI-Native UI × Bento Box Grid.
 *
 * Generated via the ui-ux-pro-max design-system reasoning engine for the
 * "AI startup evaluator / scoring engine + multi-agent fallback" product
 * profile. The brand reads as a piece of analytical instrumentation rather
 * than a magazine — deep-space navy ground, HUD-teal primary, AI-violet
 * secondary, and a high-vibrancy grade ramp engineered to read as
 * *telemetry* (not chart-junk).
 *
 * Token names are stable from the previous "Editorial AI" theme on purpose
 * (yc-bg / yc-accent / grade-s …) so component class names don't churn —
 * only the underlying values shift.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        yc: {
          // Deep-space navy ground — never pure black; always slightly blue
          // so the HUD-teal accent has somewhere to glow against.
          bg: "#060A12",
          surface: "#0C1320",
          "surface-2": "#131D30",
          border: "#1F2A40",
          "border-light": "#2C3A56",

          // Primary — HUD teal. The single instrument color.
          accent: "#00E0B8",
          "accent-soft": "#5CFFE0",
          "accent-deep": "#00B294",

          // Secondary — AI-agent violet. Reserved for AI/automation chrome
          // (active provider chips, "thinking" pulses, MCP/agent badges).
          "accent-2": "#7C5CFF",
          "accent-2-soft": "#A993FF",

          // Cool paper-white text on deep navy — high contrast, low fatigue.
          text: "#E6F1FF",
          muted: "#5C6B85",
          dim: "#8FA0BD",
        },
        grade: {
          // Telemetry-grade vibrancy. Each step is engineered to be readable
          // at small sizes against the navy ground, with at least 7:1
          // contrast for body and 4.5:1 for labels (WCAG AAA / AA).
          s: "#00FFC2",
          a: "#69E68A",
          b: "#FFD24A",
          c: "#FFA040",
          d: "#FF6A6A",
          f: "#FF3A6A",
        },
        provider: {
          // Provider chips — kept in their canonical brand hues so the
          // visual language is portable across surfaces (web, MCP, CLI).
          nvidia: "#76B900",
          gemini: "#4A9EFF",
        },
      },
      fontFamily: {
        // Body / UI — Inter (workhorse for HUD readouts and dense UI). Geist
        // kept as a fallback so the previous deploy doesn't FOIT.
        sans: [
          "'Inter'",
          "'Geist'",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        // Display / wordmark — Space Grotesk. Geometric, futurist, no serif
        // baggage. This is the visual anchor of the rebrand.
        display: [
          "'Space Grotesk'",
          "'Inter'",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Italic / quote face — kept for the "YC partner would ask" pull
        // quote. Inter italic carries the navy theme better than a serif.
        serif: [
          "'Inter'",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Mono — JetBrains Mono. The HUD reads in mono.
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
        // Retuned to teal — HUD-glow heartbeat for active instruments.
        "glow-pulse": "glowPulse 2.4s ease-in-out infinite alternate",
        // AI-agent thinking ring — slow rotating sweep around active chip.
        "agent-sweep": "agentSweep 3.2s linear infinite",
        // Telemetry shimmer — used on streaming text reveals.
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
        // Teal HUD glow heartbeat
        glowPulse: {
          "0%": { boxShadow: "0 0 18px rgba(0, 224, 184, 0.18)" },
          "100%": { boxShadow: "0 0 38px rgba(0, 224, 184, 0.50)" },
        },
        agentSweep: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        // Cool HUD grid — teal at 1.4% opacity. Replaces the warm paper grid.
        grid: "linear-gradient(rgba(0,224,184,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,224,184,0.045) 1px, transparent 1px)",
        // Faint horizontal scanlines — the signature HUD/Sci-Fi texture.
        scanline:
          "repeating-linear-gradient(0deg, rgba(230,241,255,0.025) 0px, rgba(230,241,255,0.025) 1px, transparent 1px, transparent 3px)",
      },
      backgroundSize: {
        grid: "80px 80px",
      },
    },
  },
  plugins: [],
};

export default config;
