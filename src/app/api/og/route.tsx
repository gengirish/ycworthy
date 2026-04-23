import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

/**
 * Dynamic OG image generator — renders a Mission Control–themed verdict
 * card (1200×630) for any combination of grade / company / score / tagline.
 *
 *   /api/og?grade=S&company=Stripe&score=98&tagline=Payments+infra
 *
 * Used for:
 *   • Twitter / LinkedIn / Slack link previews when sharing a verdict
 *   • The `/launch` hub's "share card" generator
 *   • The "Copy share card" button in ResultCard
 *
 * Edge runtime is required by next/og's underlying satori renderer.
 */
export const runtime = "edge";

type Grade = "S" | "A" | "B" | "C" | "D" | "F";

const GRADE_COLOR: Record<Grade, string> = {
  S: "#00FFC2",
  A: "#69E68A",
  B: "#FFD24A",
  C: "#FFA040",
  D: "#FF6A6A",
  F: "#FF3A6A",
};

const GRADE_LABEL: Record<Grade, string> = {
  S: "Exceptional",
  A: "Strong",
  B: "Solid",
  C: "Mediocre",
  D: "Weak",
  F: "Failing",
};

function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const rawGrade = (searchParams.get("grade") || "S").toUpperCase();
  const grade: Grade = (["S", "A", "B", "C", "D", "F"].includes(rawGrade)
    ? rawGrade
    : "S") as Grade;
  const company = clamp(searchParams.get("company") || "Your Startup", 32);
  const score = searchParams.get("score") || "—";
  const tagline = clamp(
    searchParams.get("tagline") || "YC partner verdict in 60 seconds.",
    120,
  );

  const gradeColor = GRADE_COLOR[grade];
  const gradeLabel = GRADE_LABEL[grade];

  // satori notes (avoid silent render failures):
  //   • every <div> with multiple children must set `display: 'flex'`
  //   • use `backgroundImage`/`backgroundColor`, not the `background` shorthand
  //   • avoid `inset` keyword in box-shadow
  //   • stick to ASCII / standard Latin glyphs (no rare unicode arrows)
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#060A12",
          color: "#E6F1FF",
          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
          position: "relative",
        }}
      >
        {/* HUD lattice background (satori-safe: explicit `to bottom`/`to right` direction + comma-separated color stops) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to bottom, rgba(0, 224, 184, 0.07), rgba(0, 224, 184, 0.07) 1px, transparent 1px, transparent 60px), linear-gradient(to right, rgba(0, 224, 184, 0.07), rgba(0, 224, 184, 0.07) 1px, transparent 1px, transparent 60px)",
          }}
        />

        {/* Teal vignette anchoring the top — satori-safe radial syntax */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(ellipse at top, rgba(0, 224, 184, 0.18) 0%, rgba(6, 10, 18, 0) 70%)",
          }}
        />

        {/* Corner ticks (HUD frame) */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            width: 28,
            height: 28,
            borderTop: "2px solid #00E0B8",
            borderLeft: "2px solid #00E0B8",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            width: 28,
            height: 28,
            borderBottom: "2px solid #00E0B8",
            borderRight: "2px solid #00E0B8",
            display: "flex",
          }}
        />

        {/* Top bar — wordmark + version chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "40px 56px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            <span style={{ display: "flex" }}>YCWorthy</span>
            <span style={{ display: "flex", color: "#00E0B8" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              color: "#00E0B8",
              fontFamily: "ui-monospace, monospace",
              letterSpacing: 3,
              textTransform: "uppercase",
              padding: "6px 14px",
              border: "1px solid rgba(0,224,184,0.35)",
              borderRadius: 999,
              backgroundColor: "rgba(0,224,184,0.05)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: "#00E0B8",
                marginRight: 10,
                display: "flex",
              }}
            />
            <span style={{ display: "flex" }}>YC Telemetry Engine</span>
          </div>
        </div>

        {/* Main grid: ring on left, info on right */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "12px 56px 24px",
            gap: 48,
            alignItems: "center",
          }}
        >
          {/* Grade ring */}
          <div
            style={{
              width: 340,
              height: 340,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: `8px solid ${gradeColor}`,
              backgroundImage: `radial-gradient(circle at center, ${gradeColor}30 0%, rgba(6, 10, 18, 0) 70%)`,
              boxShadow: `0 0 90px ${gradeColor}55`,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 220,
                fontWeight: 800,
                color: gradeColor,
                letterSpacing: -8,
                lineHeight: 1,
              }}
            >
              {grade}
            </div>
          </div>

          {/* Right column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 14,
                color: "#00E0B8",
                fontFamily: "ui-monospace, monospace",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              <span style={{ display: "flex" }}>
                Partner Verdict — {gradeLabel}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: -2.5,
                lineHeight: 1.02,
                marginBottom: 14,
                color: "#E6F1FF",
              }}
            >
              {company}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#8FA0BD",
                lineHeight: 1.35,
                marginBottom: 28,
              }}
            >
              {tagline}
            </div>

            {/* Telemetry readouts */}
            <div style={{ display: "flex", gap: 40 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 11,
                    color: "#8FA0BD",
                    fontFamily: "ui-monospace, monospace",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Score
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 32,
                    fontWeight: 700,
                    color: gradeColor,
                    fontFamily: "ui-monospace, monospace",
                    marginTop: 4,
                  }}
                >
                  {score}/100
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 11,
                    color: "#8FA0BD",
                    fontFamily: "ui-monospace, monospace",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Pipeline
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 32,
                    fontWeight: 700,
                    color: "#E6F1FF",
                    fontFamily: "ui-monospace, monospace",
                    marginTop: 4,
                  }}
                >
                  6 axes
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    display: "flex",
                    fontSize: 11,
                    color: "#8FA0BD",
                    fontFamily: "ui-monospace, monospace",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Surfaces
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#E6F1FF",
                    fontFamily: "ui-monospace, monospace",
                    marginTop: 4,
                  }}
                >
                  Web · API · MCP · CLI
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 56px",
            borderTop: "1px solid #1F2A40",
            fontSize: 16,
            color: "#8FA0BD",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span style={{ display: "flex" }}>ycworthy.intelliforge.tech</span>
          <span style={{ display: "flex" }}>
            Gemini 2.5 Flash · NVIDIA Nemotron Ultra 253B
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Cache aggressively at the edge — the inputs fully determine the
        // output, so identical query strings reuse the same baked image.
        "Cache-Control":
          "public, immutable, no-transform, max-age=31536000, s-maxage=31536000",
      },
    },
  );
}
