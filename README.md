# QuantaRoute — Setup & Configuration Guide (from scratch)

Quantum-inspired (QPSO) multi-fleet vehicle routing prototype on an OpenStreetMap canvas.
Stack: **Vite 7 · React 19 · TypeScript · Tailwind CSS v4 · Leaflet · Chart.js · lucide-react**.

---

## 0. Prerequisites

| Tool    | Version  | Check with        |
| ------- | -------- | ----------------- |
| Node.js | ≥ 20 LTS | `node -v`         |
| npm     | ≥ 10     | `npm -v`          |
| Git     | any      | `git --version`   |

Install Node from <https://nodejs.org> (LTS). No API keys are required anywhere —
OSM tiles and OSRM routing are public, key-less services.

---

## 1. Scaffold the project

```bash
npm create vite@latest quantaroute -- --template react-ts
cd quantaroute
npm install
```

> If prompted "Use rolldown-vpm / Install with npm?" answer defaults (No / Yes).

## 2. Install third-party packages

```bash
# runtime
npm install leaflet chart.js lucide-react

# dev-only
npm install -D @types/leaflet tailwindcss @tailwindcss/vite
```

Versions this prototype was verified with:

| Package           | Version   |
| ----------------- | --------- |
| react / react-dom | ^19.2.x   |
| vite              | ^7.3.x    |
| typescript        | ~5.9.x    |
| tailwindcss       | ^4.1.x    |
| @tailwindcss/vite | ^4.1.x    |
| leaflet           | ^1.9.x    |
| chart.js          | ^4.x      |
| lucide-react      | latest    |

## 3. Configure Vite (`vite.config.ts`)

Replace the file contents with:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

Tailwind v4 needs **no** `tailwind.config.js` — theme tokens live in CSS (`src/index.css`).

## 4. Global stylesheet (`src/index.css`)

First two lines are mandatory and order-sensitive:

```css
@import "leaflet/dist/leaflet.css";
@import "tailwindcss";
```

Then the `@theme { … }` block (colors, fonts), keyframes and Leaflet overrides
from this repository's `src/index.css`.

## 5. HTML shell (`index.html`)

- `<title>QuantaRoute — Quantum-Inspired Traffic Route Optimization</title>`
- Google Fonts: **Space Grotesk**, **Instrument Sans**, **JetBrains Mono**
- Inline SVG favicon (green route glyph on black tile)

## 6. TypeScript env types (`src/vite-env.d.ts`)

```ts
/// <reference types="vite/client" />
```

Required so `import logo from "./assets/logo.png"` type-checks.

## 7. Source tree

```
src/
├─ main.tsx               # root + ErrorBoundary
├─ App.tsx                # state, scenario seed, solve orchestration, views
├─ index.css              # tailwind theme + leaflet styles + animations
├─ assets/logo.png        # app logo (flat green/black)
├─ lib/
│  ├─ types.ts            # Stop, Incident, VehicleRoute, Solution, …
│  ├─ network.ts          # graph model, congestion field, capacity, palette
│  ├─ optimizer.ts        # seeded RNG, QPSO/PSO/GA/greedy, 2-opt refinement
│  └─ osrm.ts             # road-snapped geometry from OSRM (OpenStreetMap)
└─ components/
   ├─ TopBar.tsx  Sidebar.tsx  MapView.tsx  panels.tsx
   ├─ ControlDock.tsx  Benchmark.tsx  ModelSheet.tsx
   ├─ views.tsx  Toast.tsx  ErrorBoundary.tsx
```

Copy these files from this repository into the scaffold (keep paths identical).

## 8. Run it

```bash
npm run dev        # http://localhost:5173
npm run build      # production bundle in dist/
npm run preview    # serve the production build locally
```

## 9. External services used at runtime (no keys)

| Service            | Endpoint                                  | Purpose                        |
| ------------------ | ----------------------------------------- | ------------------------------ |
| OSM tiles          | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | base map                |
| OSRM demo server   | `https://router.project-osrm.org/route/v1/driving/…` | road-snapped routes |
| Esri World Imagery | `…/World_Imagery/MapServer/tile/{z}/{y}/{x}` | satellite toggle       |

All calls are guarded: offline or rate-limited responses fall back to straight-line
routes automatically.

## 10. Troubleshooting

| Symptom                          | Fix                                                                 |
| -------------------------------- | ------------------------------------------------------------------- |
| Grey map box                     | Leaflet CSS not imported, or container has no height (`h-[…]` class) |
| Map mis-sized after layout change| call `map.invalidateSize()` (already wired via ResizeObserver)       |
| Missing default marker images    | Not needed — all markers are custom `L.divIcon`                      |
| Tailwind classes do nothing      | `@tailwindcss/vite` plugin missing in `vite.config.ts`               |
| `Cannot find module './assets/logo.png'` | add `src/vite-env.d.ts` (step 6)                            |
| Routes change on every click     | ensure `seedOptimizer(scenarioSeed(...))` runs before each solve     |
| Huge bundle warning              | expected (Leaflet + Chart.js); optionally add `vite-plugin-singlefile` |

## 11. Optional: single-file build

```bash
npm i -D vite-plugin-singlefile
```

and add `singlefile()` to `plugins` in `vite.config.ts` — produces one portable
`dist/index.html`, as used for the hosted demo.
