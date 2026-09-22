# QuantaRoute — Quantum-Inspired Fleet Route Optimization & Dispatch Platform

[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite 7](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Solver](https://img.shields.io/badge/Engine-QPSO_(Quantum_PSO)-10B981)](#1-quantum-inspired-pso-qpso-engine)

**QuantaRoute** is a real-time multi-vehicle routing, dispatching, and field communication platform powered exclusively by **Quantum-Inspired Particle Swarm Optimization (QPSO)**. Built for modern urban logistics networks, QuantaRoute simulates live traffic bottlenecks and road accidents, evaluates trade-offs between **WAITING** and **REROUTING**, and features dedicated multi-role portals for **Administrators**, **Fleet Managers**, and **Fleet Drivers**.

---

## Key Capabilities

### 1. Quantum-Inspired PSO (QPSO) Engine
- **Wave-Function Delta Potential Formulation**: Swarm particles explore combinatorial permutation space with probabilistic quantum attractors $p_{ij}$ governed by personal best and global best states:
  $$X = P \pm \alpha \cdot |m_{best} - X| \cdot \ln(1/u)$$
- **Continuous Random-Key Encoding**: Robust customer-to-truck sequence encoding that guarantees feasible capacity-respecting solutions.
- **$\alpha$-Annealing Schedule**: Linear cooling parameter ($\alpha = 0.95 \to 0.50$) balances broad exploration with rapid convergence.
- **Memetic Polish (Exact TSP + 2-Opt)**: Intra-tour exact TSP for routes with $\le 8$ stops and 2-Opt string-exchange heuristics for larger tours, paired with inter-tour customer relocations to ensure clean, untangled routes.

### 2. Multi-Role Portals & Access Control

Switch seamlessly between three role perspectives from the TopBar profile menu:

#### A. Super Admin Console
- **Full Fleet Oversight**: Automated route optimization with Quantum PSO, live road disruption injection, and dynamic dispatch control.
- **Dispatch Notifications Center**: Dedicated communications hub with **Received from Drivers** (incident reports, SOS alerts, roadside assistance requests) and **Sent Broadcasts** tabs.
- **Driver Details Management**: Update driver profiles, contact information, driving license numbers, shift timings, and medical/emergency contacts.
- **Add New Fleet & Driver**: Mobile-first registration modal to onboard new vehicles (auto-incremented vehicle number, model, EV vs Diesel, plate) and assign drivers.

#### B. Fleet Operations Manager Portal
- **Fleet Dispatch Console**: Live operational KPIs (active trucks, fleet capacity utilization, planned travel duration, on-time delivery estimates).
- **All Truck Paths Map View**: By default, the Fleet Manager map displays **paths for all trucks** across the city with distinct color-coded routes. Includes interactive filter pills (`All Trucks`, `Truck #1`, `Truck #2`, etc.) to isolate individual vehicle tours.
- **Vehicles & Assigned Drivers**: Comprehensive roster displaying vehicle model, license plate, power/fuel level (EV battery or diesel), remaining stops, driver ratings, and quick communication triggers.
- **Delivery Manifest**: Organized manifest sequence with customer stop details, cargo demand units, delivery windows, and proof-of-delivery tracking.
- **Fleet Maintenance**: Real-time vehicle diagnostics, tire pressure, brake pad wear, battery health, and service scheduling.

#### C. Fleet Driver In-Cab Personal Assistant
- **Strictly Isolated Single-Route Map**: The in-cab navigation map strictly displays **only the driver's own assigned route (Vehicle #1 · Rajesh Kumar)** and assigned delivery stops, completely hiding other fleet trucks for zero distraction and privacy.
- **Live Telemetry HUD**: Real-time battery/fuel gauge, remaining driving range, and next-stop cards with 1-tap navigation and customer phone call triggers.
- **Isolated "Wait vs Reroute" View**: In-cab decision comparator showing delay and detour metrics strictly for the driver's vehicle, omitting collective fleet numbers.
- **On-Road Incident Reporting**: 1-tap reporting for heavy traffic, vehicle breakdown, roadblock, or customer unavailable, instantly alerting Dispatch and updating route simulations.
- **Personal Copilot & Direct Messaging**: Conversational assistant for traffic and battery queries, and direct two-way messaging with Admin Dispatch.

### 3. Closed Hamiltonian Cycles with Central Depot Hub
- Every vehicle departs from and returns to the dedicated **Start Point · Central Depot** (`12.9763, 77.5929` near Cubbon Park, Bangalore).
- High-fidelity origin/departure legs and return legs to replenish inventory.
- Stop bubble markers dynamically match the visiting truck's color and display the exact drop sequence number ($1, 2, 3\dots$).

### 4. Live "WAIT vs. REROUTE" Decision Comparator
When traffic congestion or accidents occur on route corridors, QuantaRoute evaluates both operational alternatives:
- **Option A (WAIT)**: Keep current routing schedule, absorb congestion delay, and incur vehicle idling fuel consumption.
- **Option B (REROUTE)**: Re-run dynamic QPSO dispatching around the bottleneck, incurring detour mileage to eliminate standstill delay.
- **Multi-Factor Trade-Off Analysis**:
  - Total Mission Duration & Active Time Saved
  - Fuel Consumption (Active Travel + Idle Delays)
  - Carbon Footprint ($CO_2$ kg)
  - Vehicle-by-Vehicle Impact Breakdown (which trucks are affected vs. unaffected)

### 5. Universal Cross-Role Notification Drafting
- Mobile-first composer allowing **Admin**, **Fleet Manager**, and **Fleet Driver** to draft and dispatch notifications to each other.
- **1-Tap Quick Templates**:
  - *Drivers*: Traffic Delay, Delivery Completed, Customer Absent, EV Battery Low.
  - *Dispatch*: Priority Dispatch, Quantum Reroute Active, Charging Slot Reserved, End of Shift Reminder.

### 6. Real Drivable Road Paths (OSRM + Precomputed Roads)
- Snaps all routes to authentic OpenStreetMap road segments using the OSRM driving profile.
- Built-in precomputed road geometry cache for instantaneous loading and zero-latency route visualization.
- Graceful offline fallback to straight-line interpolation if network connectivity is unavailable.
- Interactive satellite imagery toggle (Esri World Imagery).

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
├─ main.tsx                           # Application entrypoint & ErrorBoundary root
├─ App.tsx                            # Root state, role orchestration, and view router
├─ index.css                          # Tailwind v4 theme, font definitions, and map styles
├─ vite-env.d.ts                      # TypeScript client environment types
├─ assets/
│  └─ logo.png                        # Brand mark
├─ lib/
│  ├─ network.ts                      # Graph coordinates, depot origin, demand & Gaussian congestion fields
│  ├─ optimizer.ts                    # Core QPSO metaheuristic, 2-Opt refinement, and exact TSP polish
│  ├─ waitReroute.ts                  # WAIT vs. REROUTE trade-off comparator engine & fuel/CO2 models
│  ├─ osrm.ts                         # OSRM road geometry fetcher, caching layer, and geometry decoding
│  ├─ precomputedRoads.json           # Offline high-fidelity drivable road segments for Bangalore
│  ├─ driverTypes.ts                  # Driver roster, profile schemas, and unified notification types
│  └─ types.ts                        # Core interfaces (Stop, Incident, RunStatus, RunEntry, Solution)
└─ components/
   ├─ TopBar.tsx                      # Header navigation, live disruption status, and role switcher
   ├─ Sidebar.tsx                     # Desktop role-adaptive side navigation bar
   ├─ BottomNav.tsx                   # Mobile role-adaptive bottom navigation bar
   ├─ MapView.tsx                     # Leaflet map container, custom pins, route paths, and layer toggle
   ├─ ControlDock.tsx                 # Quantum PSO optimization status and solve action bar
   ├─ panels.tsx                      # Incident disruption bar (+Jam, +Crash), traffic alerts, and stats
   ├─ WaitRerouteComparator.tsx       # Interactive WAIT vs. REROUTE comparator (with driver route isolation)
   ├─ FleetManagerDashboard.tsx       # Fleet Manager console with all-trucks map view and route filters
   ├─ FleetVehiclesView.tsx           # Fleet vehicle cards, driver roster, and Add Fleet button
   ├─ FleetManifestView.tsx           # Delivery manifest checklist and proof-of-delivery tracking
   ├─ FleetMaintenanceView.tsx        # Fleet health diagnostics, tire pressure, and service scheduling
   ├─ DriverAssistantView.tsx         # Driver in-cab assistant, HUD, copilot, and strictly isolated route map
   ├─ DriverDeliveriesView.tsx        # Driver delivery checklist for assigned vehicle
   ├─ DriverReportsView.tsx           # Driver field incident reporting console
   ├─ DriverNotificationsView.tsx     # Driver dispatch inbox with 1-tap replies
   ├─ AdminNotificationsView.tsx      # Admin communications center (Received from Drivers & Sent Broadcasts)
   ├─ AddFleetModal.tsx               # Mobile-first modal to register new vehicle and driver
   ├─ EditDriverModal.tsx              # Admin/Manager driver details editor modal
   ├─ ProfileModal.tsx                # Role-specific profile credentials modal
   ├─ DraftNotificationModal.tsx      # Cross-role notification drafting bottom sheet
   ├─ HelpModal.tsx                   # Comprehensive in-app user guide
   ├─ ModelSheet.tsx                  # Mathematical formulation sheet (QPSO equations & objective function)
   ├─ Toast.tsx                       # Floating notification alerts
   ├─ ErrorBoundary.tsx               # Application error boundary
   └─ views.tsx                       # DeliveriesView, DeliveryModal, HistoryView, LiveTrackingView, SettingsView
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

Preview the production bundle locally:

```bash
npm run preview
```

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
