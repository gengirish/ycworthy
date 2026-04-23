---
name: ycworthy-frontend
description: Build and maintain the YCWorthy Next.js frontend with Tailwind CSS, dark theme, animations, and responsive components. Use when creating pages, components, animations, styling, or frontend patterns.
---

# YCWorthy Next.js Frontend

## Tech Stack

```json
{
  "dependencies": {
    "next": "14.2.29",
    "react": "^18.3",
    "react-dom": "^18.3",
    "clsx": "^2.1",
    "framer-motion": "^12.38",
    "zod": "^3.24"
  },
  "devDependencies": {
    "tailwindcss": "^3.4",
    "postcss": "^8.5",
    "autoprefixer": "^10.4",
    "typescript": "^5"
  }
}
```

## Tailwind Configuration

Custom theme in `tailwind.config.ts`:

- **Colors**: `yc-bg`, `yc-surface`, `yc-border`, `yc-accent`, `yc-text`, `yc-muted`
- **Grade colors**: `grade-s` through `grade-f`
- **Provider colors**: `provider-nvidia` (#76B900), `provider-gemini` (#4A9EFF)
- **Animations**: `fade-up`, `pulse`, `bounce`, `score-fill`, `glow-pulse`
- **Background**: `bg-grid` for subtle grid overlay

## Component Template

```tsx
"use client";

import clsx from "clsx";

interface Props {
  variant: "primary" | "secondary";
}

export function ComponentName({ variant }: Props) {
  return (
    <div
      className={clsx(
        "bg-yc-surface border rounded-xl p-5 transition-all",
        variant === "primary" ? "border-yc-accent/30" : "border-yc-border"
      )}
    >
      <div className="font-mono text-[10px] text-yc-muted uppercase tracking-[2px] mb-2">
        Label
      </div>
      <p className="text-sm text-[#bbb] leading-relaxed">Content</p>
    </div>
  );
}
```

## Grade Display Pattern

Use `GRADE_COLOR` and `GRADE_BG` from `src/lib/types.ts` for dynamic colors:

```tsx
import { GRADE_COLOR, GRADE_BG } from "@/lib/types";

const color = GRADE_COLOR[result.grade]; // e.g. "#00FFB2"
const bg = GRADE_BG[result.grade];       // e.g. "rgba(0,255,178,0.07)"
```

For grade glows, use the CSS utility classes in `globals.css`:
`grade-glow-s`, `grade-glow-a`, `grade-glow-b`, `grade-glow-c`, `grade-glow-d`, `grade-glow-f`

## Animation Patterns

### Fade Up (most sections)
```tsx
<div className="animate-fade-up">Content</div>
```

### Staggered Fade Up (lists)
```tsx
{items.map((item, i) => (
  <div
    key={item.key}
    className="animate-fade-up"
    style={{ animationDelay: `${i * 80}ms` }}
  >
    {item.content}
  </div>
))}
```

### Score Bar (animated width)
```tsx
const [w, setW] = useState(0);
useEffect(() => {
  const t = setTimeout(() => setW(score), 150);
  return () => clearTimeout(t);
}, [score]);

<div style={{ width: `${w}%` }}
     className="transition-[width] duration-[1300ms] ease-[cubic-bezier(0.22,1,0.36,1)]" />
```

### Loading Dots
```tsx
{[0, 1, 2].map((i) => (
  <span
    key={i}
    className="inline-block w-2 h-2 bg-yc-accent rounded-full mx-[5px] animate-bounce"
    style={{ animationDelay: `${i * 0.18}s` }}
  />
))}
```

## Input/Button Patterns

### URL Input Bar
```tsx
<div className="flex border border-yc-border rounded-[10px] overflow-hidden bg-yc-surface">
  <div className="px-3.5 flex items-center text-yc-border-light font-mono text-[13px]">
    https://
  </div>
  <input className="flex-1 bg-transparent border-none outline-none text-yc-text text-[15px] py-[18px] font-mono min-w-0" />
  <button className="px-[26px] font-mono font-black text-xs tracking-[1px] uppercase bg-yc-accent text-black">
    Rate It →
  </button>
</div>
```

### Ghost Button
```tsx
<button className="bg-transparent border border-yc-border text-yc-muted px-7 py-2.5 rounded-lg font-mono text-xs tracking-[1px] uppercase transition-all hover:border-yc-border-light hover:text-yc-dim">
  ← Analyze Another
</button>
```

## Eyebrow Label Pattern

```tsx
<div className="font-mono text-[10px] text-yc-accent tracking-[2px] uppercase mb-2.5">
  ◈ Section Title
</div>
```

## Card Pattern

```tsx
<div
  className="bg-yc-surface rounded-xl p-[18px_20px]"
  style={{ border: `1px solid ${color}20` }}
>
  {/* Card content */}
</div>
```

## Responsive Breakpoints

| Breakpoint | Changes |
|------------|---------|
| < 640px (sm) | Single-column flags, stacked layouts |
| < 768px (md) | Single-column criteria grid |
| ≥ 768px | 2-column criteria grid, side-by-side flags |

## Key Rules

1. **Mission Control dark theme only** — no light mode, deep-space navy `#060A12` background (never pure black)
2. **Use `clsx`** for conditional class names, not string concatenation
3. **Dynamic colors via `style` prop** when Tailwind can't express them (grade colors keyed off `GRADE_COLOR`)
4. **Font mono for telemetry/labels** (`font-mono text-[10px] tracking-[2px] uppercase`) — JetBrains Mono
5. **Font display (Space Grotesk) for headlines + grade letters**, font sans (Inter) for body
6. **HUD teal `yc-accent` (`#00E0B8`)** for primary chrome only (buttons, focus rings, wordmark dot, links). **AI-violet `yc-accent-2`** only for AI/automation chrome. Never use either for grade data.
7. **Never use `alert()`** — show inline error messages
8. **All data constants in `src/lib/types.ts`** — `GRADE_COLOR`, `GRADE_BG`, `CRITERIA_META`, etc.
9. **`animate-fade-up`** for section entrances; `glow-pulse` for active instruments; `animate-pulse` on the active provider chip dot
10. **Wrap the verdict header + interview-question card in `.hud-frame`** — that's the signature instrument-panel chrome
11. **Mobile-first** — design for 375px, scale up with `sm:`, `md:`
