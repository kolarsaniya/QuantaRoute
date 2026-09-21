import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Atom,
  CheckCircle2,
  CircleHelp,
  GitCompare,
  Hourglass,
  Layers,
  MapPin,
  Navigation,
  Package,
  Route,
  Sparkles,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "start" | "qpso" | "wait-reroute" | "controls";

export function HelpModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("start");

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="anim-pop flex h-[85vh] max-h-[680px] w-full max-w-2xl flex-col rounded-2xl border border-line bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="flex items-center justify-between border-b border-line px-5 py-4 bg-paper/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green text-white shadow-sm">
              <CircleHelp size={18} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink sm:text-lg">
                QuantaRoute User Guide & Help
              </h2>
              <p className="text-[11px] text-ink-faint">
                Understanding the QPSO engine, Start Hub, and WAIT vs. REROUTE decision analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close help"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition hover:bg-line/70 hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Navigation */}
        <nav className="flex border-b border-line bg-card px-4 pt-2 gap-1 overflow-x-auto text-[12px] font-bold">
          <button
            onClick={() => setActiveTab("start")}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition whitespace-nowrap ${
              activeTab === "start"
                ? "border-green text-green font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Warehouse size={14} /> Start & Depot
          </button>
          <button
            onClick={() => setActiveTab("qpso")}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition whitespace-nowrap ${
              activeTab === "qpso"
                ? "border-green text-green font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Atom size={14} /> QPSO Engine
          </button>
          <button
            onClick={() => setActiveTab("wait-reroute")}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition whitespace-nowrap ${
              activeTab === "wait-reroute"
                ? "border-green text-green font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <GitCompare size={14} /> WAIT vs REROUTE
          </button>
          <button
            onClick={() => setActiveTab("controls")}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition whitespace-nowrap ${
              activeTab === "controls"
                ? "border-green text-green font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Navigation size={14} /> Deliveries & Controls
          </button>
        </nav>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 dark-scroll text-[13px] text-ink-soft leading-relaxed">
          {activeTab === "start" && (
            <div className="space-y-4 anim-slide">
              <div className="rounded-xl border border-green/30 bg-green-tint/40 p-4">
                <div className="flex items-center gap-2">
                  <Warehouse size={16} className="text-green" />
                  <h3 className="font-display font-bold text-ink text-sm">
                    Central Depot (The Start & Return Hub)
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">
                  Every vehicle tour in QuantaRoute forms a mathematically closed <strong>Hamiltonian Cycle</strong>.
                  All delivery trucks leave from the <strong>Start Point (Central Depot)</strong>, visit their assigned customer drop locations along optimal OpenStreetMap road paths, and return to the Central Depot.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-paper/50 p-3.5">
                  <p className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <MapPin size={13} className="text-green" /> Departure Leg
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Trucks are loaded up to vehicle capacity and depart in a staggered queue from Cubbon Park junction along real drivable street segments.
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper/50 p-3.5">
                  <p className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-deep" /> Return Leg
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    After completing the final drop, the truck returns directly back to the Central Depot to finalize deliveries and replenish inventory.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-card p-4">
                <h4 className="font-display font-bold text-ink text-[12px] uppercase tracking-wide">
                  Route Representation on the Map
                </h4>
                <ul className="mt-2 space-y-1.5 text-[12px]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-green shrink-0" />
                    <span><strong>Green "Start · Central Depot" Pin</strong>: Centered directly at the road junction coordinate. All colored route polylines originate and finish at this pin.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                    <span><strong>Numbered Bubbles (1, 2, 3...)</strong>: Customer delivery stops colored according to the assigned truck.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>Animated Dashed Paths</strong>: High-fidelity OpenStreetMap driving curves showing traffic direction arrows.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "qpso" && (
            <div className="space-y-4 anim-slide">
              <div className="rounded-xl border border-green/30 bg-green-tint/40 p-4">
                <div className="flex items-center gap-2">
                  <Atom size={16} className="text-green" />
                  <h3 className="font-display font-bold text-ink text-sm">
                    Pure Quantum-Behaved Particle Swarm Optimization
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">
                  QuantaRoute utilizes an exclusive <strong>Quantum PSO (QPSO)</strong> metaheuristic.
                  Unlike classical PSO or Genetic Algorithms, QPSO removes velocity vectors and models particle positions using quantum delta potential wells.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-card p-3.5">
                  <h4 className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-green" /> Mean Best & Quantum Attractor
                  </h4>
                  <p className="mt-1 text-[11px] text-ink-faint leading-relaxed">
                    Particles converge toward a probabilistic quantum attractor p(i, j) governed by personal best and global best swarm positions.
                    Because quantum particles have non-zero probability of appearing anywhere in the search space, QPSO effectively escapes local minima that trap classical solvers.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-card p-3.5">
                  <h4 className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <Route size={13} className="text-green" /> 2-Opt & Exact TSP Memetic Polish
                  </h4>
                  <p className="mt-1 text-[11px] text-ink-faint leading-relaxed">
                    After global QPSO swarm convergence, a deterministic memetic step performs exact Hamiltonian TSP optimization per vehicle (up to 8 stops per truck) and inter-tour relocation swaps to eliminate any zig-zags or crossed routes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "wait-reroute" && (
            <div className="space-y-4 anim-slide">
              <div className="rounded-xl border border-line bg-paper/60 p-4">
                <div className="flex items-center gap-2">
                  <GitCompare size={16} className="text-ink" />
                  <h3 className="font-display font-bold text-ink text-sm">
                    Understanding WAIT vs. REROUTE
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">
                  When traffic bottlenecks or accidents occur in real-time, QuantaRoute dynamically computes and compares two operational strategies:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-amber/30 bg-amber/5 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <Hourglass size={14} className="text-amber" />
                    <h4 className="font-bold text-ink text-[12px]">Option A: WAIT</h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-soft">
                    <strong>Hold planned route sequence</strong> and absorb congestion delay.
                  </p>
                  <ul className="mt-2 space-y-1 text-[10px] text-ink-faint">
                    <li>• Zero extra mileage or detours</li>
                    <li>• Idling fuel consumption during gridlock</li>
                    <li>• Recommended when congestion is light or short-lived</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-green/30 bg-green-tint/50 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <Navigation size={14} className="text-green" />
                    <h4 className="font-bold text-ink text-[12px]">Option B: REROUTE</h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-soft">
                    <strong>Run dynamic QPSO re-dispatch</strong> to bypass congested road corridors.
                  </p>
                  <ul className="mt-2 space-y-1 text-[10px] text-ink-faint">
                    <li>• Active travel time savings</li>
                    <li>• Extra detour distance, but eliminates stationary idling</li>
                    <li>• Recommended during severe accidents or blocked roads</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-card p-3.5 text-[11px] text-ink-faint">
                <p>
                  💡 <strong>Tip:</strong> Access the full comparison at any time by selecting the <strong>Wait vs Reroute</strong> tab in the sidebar or clicking the prompt on any traffic alert.
                </p>
              </div>
            </div>
          )}

          {activeTab === "controls" && (
            <div className="space-y-4 anim-slide">
              <div className="rounded-xl border border-line bg-paper/60 p-4">
                <h3 className="font-display font-bold text-ink text-sm">
                  Delivery Management & App Controls
                </h3>
                <p className="mt-1 text-[12px] text-ink-soft">
                  Quick tips on customizing scenarios, managing deliveries, and exploring results.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <Package size={16} className="text-green mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Adding New Deliveries</p>
                    <p className="text-[11px] text-ink-faint">
                      Click <strong>"Add Delivery"</strong> in the top header, then click anywhere on the Bangalore map. Enter customer name and demand units to immediately update routes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <AlertTriangle size={16} className="text-amber mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Simulating Traffic Disruptions</p>
                    <p className="text-[11px] text-ink-faint">
                      Click <strong>"+ Jam"</strong> or <strong>"+ Accident"</strong> in the top disruption bar. QuantaRoute instantly triggers WAIT vs REROUTE evaluation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <Truck size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Fleet Sizing</p>
                    <p className="text-[11px] text-ink-faint">
                      Use the Fleet Size counter in the control dock to adjust the number of available trucks (1 to 5). Vehicle capacities automatically adjust.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <Layers size={16} className="text-ink-soft mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Map vs. Satellite</p>
                    <p className="text-[11px] text-ink-faint">
                      Use the floating layer button at the bottom-right of the map to toggle between OpenStreetMap street vector view and high-resolution Esri satellite imagery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="flex items-center justify-between border-t border-line bg-paper/60 px-5 py-3 text-[12px]">
          <span className="font-mono text-[10px] font-semibold text-ink-faint">
            QuantaRoute v2.4 · Quantum PSO Engine
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-green px-4 py-2 font-display text-[12px] font-bold text-white shadow-[0_2px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5 active:shadow-none"
          >
            Got it, close
          </button>
        </footer>
      </div>
    </div>
  );
}
