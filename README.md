# QuantaRoute — Quantum-Inspired Fleet Route Optimization

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite 7](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Solver](https://img.shields.io/badge/Engine-QPSO_(Quantum_PSO)-10B981)](#1-quantum-inspired-pso-qpso-engine)

**QuantaRoute** is a high-performance, real-time multi-vehicle routing and fleet dispatch platform powered exclusively by **Quantum-Inspired Particle Swarm Optimization (QPSO)**. Built for dynamic urban delivery networks, QuantaRoute simulates live traffic bottlenecks and accidents, analyzes trade-offs between **WAITING** and **REROUTING**, and snaps all fleet routes to actual OpenStreetMap driving networks.

---

## Key Capabilities

### 1. Quantum-Inspired PSO (QPSO) Engine
- **Wave-Function Delta Potential Formulation**: Particles converge toward a probabilistic quantum attractor $p_{ij}$ governed by personal best and global best swarm states:
  $$X = P \pm \alpha \cdot |m_{best} - X| \cdot \ln(1/u)$$
- **Continuous Random-Key Encoding**: Robust customer-to-truck sequence encoding that prevents infeasible solutions and explores the combinatorial permutation space.
- **$\alpha$-Annealing Schedule**: Linear cooling parameter ($\alpha = 0.95 \to 0.50$) balances global exploration with rapid convergence.
- **Memetic Polish (Exact TSP + 2-Opt)**: Intra-tour exact TSP for routes with $\le 8$ stops and 2-Opt string-exchange heuristics for larger routes, paired with inter-tour customer relocations to ensure clean, untangled routes.

### 2. Closed Hamiltonian Cycles with Central Depot Hub
- Every vehicle departs from and returns to the dedicated **Start Point · Central Depot** (`12.9763, 77.5929` near Cubbon Park, Bangalore).
- High-fidelity origin/departure legs and return legs to replenish inventory.
- Stop bubble markers dynamically match the visiting truck's color and display the exact drop sequence number ($1, 2, 3\dots$).

### 3. Live "WAIT vs. REROUTE" Decision Comparator
When traffic congestion or accidents occur on route corridors, QuantaRoute evaluates both operational alternatives:
- **Option A (WAIT)**: Keep current routing schedule, absorb congestion delay, and incur vehicle idling fuel consumption.
- **Option B (REROUTE)**: Re-run dynamic QPSO dispatching around the bottleneck, incurring detour mileage to eliminate standstill delay.
- **Multi-Factor Trade-Off Analysis**:
  - Total Mission Duration & Active Time Saved
  - Fuel Consumption (Active Travel + Idle Delays)
  - Carbon Footprint ($CO_2$ kg)
  - Vehicle-by-Vehicle Impact Breakdown (which trucks are affected vs. unaffected)

### 4. Real Drivable Road Paths (OSRM + Precomputed Roads)
- Snaps all routes to authentic OpenStreetMap road segments using the OSRM driving profile.
- Built-in precomputed road geometry cache for instantaneous loading and zero-latency route visualization.
- Graceful offline fallback to straight-line interpolation if network connectivity is unavailable.
- Interactive satellite imagery toggle (Esri World Imagery).

### 5. Situation-Aware Optimization History
Real-time status tracking reflects the exact conditions that triggered each solve:
- 🟢 **OPTIMAL**: Free-flow baseline route calculated with no active incidents.
- 🔵 **REROUTED**: Congestion or roadblock detected — QPSO recomputed a detour and displays time saved.
- 🟡 **WAITING**: Traffic incident detected, but waiting out the congestion is evaluated to be faster than detouring.
- 🔴 **ACCIDENT**: Critical road blockage incident detected on the corridor.
- 🟢 **CLEARED**: Incidents cleared and normal free-flow operations restored.
- 🔴 **OVERLOAD**: Customer demand exceeded vehicle capacity.

---

## Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 + TypeScript | Component state, reactive UI, and strict type safety |
| **Build Tool** | Vite 7 (`vite-plugin-singlefile`) | Lightning-fast HMR and self-contained single-file HTML bundle |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) | Next-generation zero-config CSS styling with custom theme tokens |
| **Mapping** | Leaflet 1.9 | Interactive vector map, satellite layer, custom markers, and path rendering |
| **Routing** | OSRM (OpenStreetMap) | Drivable road geometry snapping and distance calculation |
| **Optimization** | Custom QPSO + Memetic 2-Opt | Pure TypeScript quantum swarm metaheuristic with seeded reproducibility |

---

## Source Tree

```
src/
├─ main.tsx                      # Application entrypoint & ErrorBoundary root
├─ App.tsx                       # State machine, scenario orchestration, and view router
├─ index.css                     # Tailwind v4 theme, font definitions, and map styles
├─ vite-env.d.ts                 # TypeScript client environment types
├─ assets/
│  └─ logo.png                   # Brand mark
├─ lib/
│  ├─ network.ts                 # Graph coordinates, depot origin, demand & Gaussian congestion fields
│  ├─ optimizer.ts               # Core QPSO metaheuristic, 2-Opt refinement, and exact TSP polish
│  ├─ waitReroute.ts             # WAIT vs. REROUTE trade-off comparator engine & fuel/CO2 models
│  ├─ osrm.ts                    # OSRM road geometry fetcher, caching layer, and geometry decoding
│  ├─ precomputedRoads.json      # Offline high-fidelity drivable road segments for Bangalore
│  └─ types.ts                   # Core interfaces (Stop, Incident, RunStatus, RunEntry, Solution)
└─ components/
   ├─ TopBar.tsx                 # Header navigation, live disruption status, and Help trigger
   ├─ Sidebar.tsx                # Desktop side navigation bar
   ├─ BottomNav.tsx              # Mobile/tablet bottom navigation bar
   ├─ MapView.tsx                # Leaflet map container, custom pins, route paths, and layer toggle
   ├─ ControlDock.tsx            # Fleet size slider, scenario resets, and solve action bar
   ├─ panels.tsx                 # Incident disruption bar (+Jam, +Crash), traffic alerts, and stats
   ├─ WaitRerouteComparator.tsx  # Interactive WAIT vs. REROUTE modal and side-by-side dashboard
   ├─ HelpModal.tsx              # Comprehensive in-app user guide (Depot Hub, QPSO, Comparator, Controls)
   ├─ ModelSheet.tsx             # Mathematical formulation sheet (QPSO equations & objective function)
   ├─ Toast.tsx                  # Floating notification alerts
   ├─ ErrorBoundary.tsx          # Application error boundary
   └─ views.tsx                  # Main views:
                                 #  ├─ DeliveriesView (custom delivery stops & depot display)
                                 #  ├─ DeliveryModal (interactive map-click delivery creator)
                                 #  ├─ HistoryView (situation-aware status history table)
                                 #  ├─ LiveTrackingView (animated truck dispatch queue & route progress)
                                 #  └─ SettingsView (road-snap toggle & engine diagnostics)
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: `≥ 20 LTS` (recommended: Node 20 or Node 22)
- **npm**: `≥ 10`

No API keys are required. All tile layers and routing services use public, keyless OpenStreetMap and OSRM endpoints with offline caching.

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/kolarsaniya/QuantaRoute.git
cd QuantaRoute
npm install
```

### 3. Development Server

Start the local development server with Vite HMR:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production Build

Compile the production bundle (generates a portable, self-contained `dist/index.html`):

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## User Workflows & Controls

1. **Viewing Routes**:
   - Click **"Find Best Route"** to trigger the QPSO solver.
   - Observe trucks departing from the **Start Point · Central Depot** and returning upon finishing all customer drops.
2. **Adding Custom Deliveries**:
   - Click **"Add Delivery"** in the top header or Deliveries view.
   - Click any location on the Bangalore canvas to place a new delivery stop and specify unit demands.
3. **Simulating Disruptions**:
   - Click **"+ Jam"** or **"+ Crash"** in the disruption bar to inject real-time road incidents.
   - QuantaRoute dynamically recalculates the network edge weights using a Gaussian congestion field.
4. **Comparing WAIT vs. REROUTE**:
   - Inspect the **WAIT vs REROUTE** comparison panel to review time saved, detour distance, and fuel savings.
   - Use the map toggle to switch between the original route sequence (**WAIT**) and the detour bypass (**REROUTE**).
5. **Tracking Live Fleet Dispatch**:
   - Switch to the **Tracking** tab to observe animated vehicle dispatch sequences along real street segments.
6. **Reviewing Optimization History**:
   - Open the **History** tab to inspect all previous runs with color-coded status badges (`OPTIMAL`, `REROUTED`, `WAITING`, `ACCIDENT`, `CLEARED`, `OVERLOAD`) and situational descriptions.

---

## Mathematical Formulation

The Capacitated Vehicle Routing Problem with Traffic Disruptions (CVRP-TD) is modeled as:

$$\min \sum_{k \in K} \sum_{(i,j) \in E} c_{ij}(\tau) \cdot x_{ijk} + \lambda \sum_{k \in K} \max\left(0, \sum_{i \in V} d_i y_{ik} - Q\right)$$

Subject to:
1. Every customer stop is visited exactly once: $\sum_{k} y_{ik} = 1, \; \forall i \in V \setminus \{0\}$.
2. Route continuity and closed cycle: $\sum_{j} x_{0jk} = \sum_{j} x_{j0k} = 1, \; \forall k \in K$.
3. Subtour elimination via flow and capacity constraints.
4. Dynamic edge travel time:
   $$t_{ij}(\tau) = \frac{\text{dist}_{ij}}{v_0} \cdot \left[1 + \sum_{m \in M} \gamma_m \cdot \exp\left(-\frac{\|\text{mid}_{ij} - \text{loc}_m\|^2}{2\sigma_m^2}\right)\right]$$

---

## License & Attribution
- Map Data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- Routing Engine © [OSRM Project](http://project-osrm.org/).
- Satellite Imagery © [Esri World Imagery](https://www.esri.com/).
