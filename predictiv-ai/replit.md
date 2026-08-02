# SafeFactory Intelligence

AI-powered predictive maintenance platform built with TanStack Start, React, TypeScript, and Tailwind CSS v4.

## Stack

- **Framework**: TanStack Start (TanStack Router + Vite + SSR via Nitro)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui (Radix primitives)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Runtime**: Bun
- **Type safety**: TypeScript

## Running the app

```bash
bun run dev   # starts Vite dev server on port 5000
```

The configured workflow is **Start application** (`bun run dev`, port 5000).

## Project structure

```
src/
  routes/
    index.tsx          — Landing page (light theme, Framer Motion sections)
    app.tsx            — App shell (sidebar layout, dark theme)
    app.index.tsx      — Overview / dashboard
    app.prediction.tsx — Failure Prediction module
    app.diagnosis.tsx  — Failure Diagnosis module
    app.risk.tsx       — Risk Assessment module
    app.priority.tsx   — Maintenance Priority module
    app.assistant.tsx  — AI Assistant module
    app.report.tsx     — Intelligence Report module
  components/
    app/               — AppShell, InsightCard, PageHeader
    site/              — SiteNav, SiteFooter (landing page chrome)
    ui/                — shadcn/ui component library
  lib/
    inference.ts       — AI model logic (prediction, diagnosis, risk, priority)
    pipeline-store.ts  — React context for cross-module state
  styles.css           — Tailwind v4 theme tokens (light + dark)
```

## Design system

- **Light theme** (`:root`) is the default — used on the landing page
- **Dark theme** (`.dark`) applied by the app shell for the workspace
- Brand color: `oklch(0.62 0.16 220)` — teal-blue
- Display font: Instrument Serif (`font-display`)
- Body font: Inter (`font-sans`)
- Radius base: 0.875rem (rounded-xl equivalent)

## Important notes

- `vite.config.ts` uses `@lovable.dev/vite-tanstack-config` which defaults to `host: "::"`. Overridden via `vite: { server: { host: "0.0.0.0", port: 5000 } }` for Replit compatibility.
- The app pipeline context (`PipelineContext`) threads prediction → diagnosis → risk → priority state across modules.
- All AI inference runs client-side in `src/lib/inference.ts` — no external API calls.

## User preferences

- Light theme only on the landing page
- No fake statistics or fabricated KPIs — all claims are factual and high-level
- Saudi Vision 2030 references must use publicly available, verifiable statements
- Premium enterprise SaaS design aesthetic (Stripe / Linear / Vercel style)
- Instrument Serif for display headings, Inter for body
- Framer Motion for scroll-triggered section animations
