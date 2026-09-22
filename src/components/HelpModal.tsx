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
                Simple guide to managing trucks, deliveries, and choosing between waiting or rerouting
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
            <Warehouse size={14} /> Start Hub & Stops
          </button>
          <button
            onClick={() => setActiveTab("qpso")}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition whitespace-nowrap ${
              activeTab === "qpso"
                ? "border-green text-green font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Sparkles size={14} /> Smart Route Engine
          </button>
          <button
            onClick={() => setActiveTab("wait-reroute")}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition whitespace-nowrap ${
              activeTab === "wait-reroute"
                ? "border-green text-green font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <GitCompare size={14} /> Wait vs. Reroute
          </button>
          <button
            onClick={() => setActiveTab("controls")}
            className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition whitespace-nowrap ${
              activeTab === "controls"
                ? "border-green text-green font-bold"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            <Navigation size={14} /> How to Use
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
                    The Central Hub (Start & Return Point)
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">
                  Every truck in your fleet starts its day from the <strong>Central Hub (Cubbon Park)</strong> and returns back to the hub once all customer packages are delivered.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-paper/50 p-3.5">
                  <p className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <MapPin size={13} className="text-green" /> 1. Heading Out
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Trucks get loaded with packages up to their capacity and leave the central hub along real city streets.
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-paper/50 p-3.5">
                  <p className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-deep" /> 2. Returning Home
                  </p>
                  <p className="mt-1 text-[11px] text-ink-faint">
                    After dropping off the last package, each truck drives straight back to the hub to park or reload for the next trip.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-card p-4">
                <h4 className="font-display font-bold text-ink text-[12px] uppercase tracking-wide">
                  What You See on the Map
                </h4>
                <ul className="mt-2 space-y-2 text-[12px]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-green shrink-0" />
                    <span><strong>Green "Start · Central Depot" Pin</strong>: The home base where all trucks start and return.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                    <span><strong>Numbered Circles (1, 2, 3...)</strong>: Customer delivery stops in the exact order they should be visited.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    <span><strong>Colored Driving Lines</strong>: The fastest real-road driving path for each truck. Each truck has its own color.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "qpso" && (
            <div className="space-y-4 anim-slide">
              <div className="rounded-xl border border-green/30 bg-green-tint/40 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-green" />
                  <h3 className="font-display font-bold text-ink text-sm">
                    How the Smart Route Engine Works
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">
                  QuantaRoute uses a smart route-planning engine called <strong>QPSO</strong>. It is designed to find the fastest delivery routes for multiple trucks at the same time.
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-line bg-card p-3.5">
                  <h4 className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <Atom size={13} className="text-green" /> Tests Thousands of Paths in Seconds
                  </h4>
                  <p className="mt-1 text-[11px] text-ink-faint leading-relaxed">
                    Instead of checking one road at a time like basic GPS, our engine explores thousands of route combinations all at once. This guarantees your trucks find the shortest paths without getting stuck in congested areas.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-card p-3.5">
                  <h4 className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <Route size={13} className="text-green" /> Cleans Up Zig-Zags & Backtracking
                  </h4>
                  <p className="mt-1 text-[11px] text-ink-faint leading-relaxed">
                    The engine automatically smooths out delivery orders so drivers never criss-cross or drive in loops. Each driver gets a neat, direct sequence of stops.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-card p-3.5">
                  <h4 className="font-bold text-ink text-[12px] flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green" /> Respects Truck Capacity
                  </h4>
                  <p className="mt-1 text-[11px] text-ink-faint leading-relaxed">
                    Packages are distributed evenly across your trucks so no single vehicle is overloaded.
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
                    Should You Wait or Take a Detour?
                  </h3>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">
                  When a traffic jam or accident happens, drivers usually wonder: <em>"Should I wait it out, or take a side road around it?"</em> QuantaRoute compares both choices automatically:
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-amber/30 bg-amber/5 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <Hourglass size={14} className="text-amber" />
                    <h4 className="font-bold text-ink text-[12px]">Choice 1: WAIT</h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-soft">
                    Stay on the current road and wait for traffic to move.
                  </p>
                  <ul className="mt-2 space-y-1 text-[10px] text-ink-faint">
                    <li>• Best when traffic is light or short-lived</li>
                    <li>• No extra driving distance or unfamiliar roads</li>
                    <li>• Truck burns a little fuel while idling</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-green/30 bg-green-tint/50 p-3.5">
                  <div className="flex items-center gap-1.5">
                    <Navigation size={14} className="text-green" />
                    <h4 className="font-bold text-ink text-[12px]">Choice 2: REROUTE</h4>
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-soft">
                    Take an alternative detour road to drive around the jam.
                  </p>
                  <ul className="mt-2 space-y-1 text-[10px] text-ink-faint">
                    <li>• Best during major accidents or standstill gridlock</li>
                    <li>• Keeps trucks moving so deliveries arrive on time</li>
                    <li>• Extra distance, but saves time and prevents wasted idle fuel</li>
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-card p-3.5 text-[11px] text-ink-faint">
                <p>
                  💡 <strong>How to decide:</strong> Look at the <strong>Wait vs. Reroute</strong> tab anytime. The green recommendation banner tells you the best decision and shows how many minutes and liters of fuel you save!
                </p>
              </div>
            </div>
          )}

          {activeTab === "controls" && (
            <div className="space-y-4 anim-slide">
              <div className="rounded-xl border border-line bg-paper/60 p-4">
                <h3 className="font-display font-bold text-ink text-sm">
                  How to Use the App (Quick Steps)
                </h3>
                <p className="mt-1 text-[12px] text-ink-soft">
                  Here is how you can customize deliveries and test different scenarios in seconds:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <Package size={16} className="text-green mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Add a New Customer Stop</p>
                    <p className="text-[11px] text-ink-faint">
                      Click <strong>"Add Delivery"</strong> at the top, then tap anywhere on the map to drop a new pin. Enter the customer's name and package count, and routes update instantly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <AlertTriangle size={16} className="text-amber mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Simulate Traffic Jams & Accidents</p>
                    <p className="text-[11px] text-ink-faint">
                      Click <strong>"+ Traffic Jam"</strong> or <strong>"+ Road Accident"</strong> to add road disruption. The app will immediately calculate whether trucks should wait or reroute.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <Truck size={16} className="text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Dynamic Route Optimization</p>
                    <p className="text-[11px] text-ink-faint">
                      Click <strong>"Re-optimize now"</strong> to automatically compute the shortest, congestion-aware paths across all delivery vehicles using Quantum PSO.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-line bg-card p-3">
                  <Layers size={16} className="text-ink-soft mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink text-[12px]">Street Map vs. Satellite View</p>
                    <p className="text-[11px] text-ink-faint">
                      Click the layers button at the bottom-right of the map to switch between clean street road map and real satellite photography.
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
            QuantaRoute · Smart Dispatch Assistant
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
