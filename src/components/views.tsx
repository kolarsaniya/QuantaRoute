import { useEffect, useMemo, useRef, useState } from "react";
import { Atom, MapPinned, Minus, Pause, Play, Plus, Route, Trash2, Warehouse, X } from "lucide-react";
import type { Incident, RunEntry, RunStatus, Stop, VehicleRoute } from "../lib/types";
import { DEPOT } from "../lib/network";
import { MapView } from "./MapView";

/* ---------------- My Deliveries ---------------- */
export function DeliveriesView({
  stops,
  addMode,
  onToggleAdd,
  onRemove,
}: {
  stops: Stop[];
  addMode: boolean;
  onToggleAdd: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <section className="anim-up rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">My Deliveries</h2>
          <p className="text-[12px] text-ink-faint">
            {stops.length} stops · {stops.reduce((s, x) => s + x.demand, 0)} units total — tap the map to add your own.
          </p>
        </div>
        <button
          onClick={onToggleAdd}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 font-display text-[13px] font-bold text-white shadow-[0_3px_0_rgba(11,15,14,0.25)] transition active:translate-y-0.5 active:shadow-none ${
            addMode ? "bg-ink" : "bg-green shadow-[0_3px_0_#0c7a37]"
          }`}
        >
          {addMode ? <X size={15} /> : <Plus size={15} />}
          {addMode ? "Cancel" : "Add Delivery"}
        </button>
      </div>

      {/* Fixed Start Point (Depot origin) */}
      <div className="mt-4 rounded-xl border border-green/30 bg-green-tint/40 p-3 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green text-white font-bold shadow-sm">
          <Warehouse size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-[13px] font-bold text-ink">Start Point · {DEPOT.name}</p>
            <span className="rounded-full bg-green text-white text-[9px] font-mono font-bold px-2 py-0.5 uppercase tracking-wider">
              Fleet Origin Hub
            </span>
          </div>
          <p className="font-mono text-[10px] text-ink-faint">
            {DEPOT.lat.toFixed(4)}, {DEPOT.lng.toFixed(4)} · All routes depart and return here
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[10px] font-bold text-green-deep border border-green/20">
          Hub · 0 units
        </span>
      </div>

      <ul className="mt-2 divide-y divide-line">
        {stops.map((s, i) => (
          <li key={s.id} className="anim-slide flex items-center gap-3 py-2.5" style={{ animationDelay: `${i * 30}ms` }}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white font-mono text-[11px] font-bold text-ink">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">{s.name}</p>
              <p className="font-mono text-[10px] text-ink-faint">
                {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
              </p>
            </div>
            <span className="rounded-full bg-green-tint px-2 py-0.5 font-mono text-[10px] font-bold text-green-deep">
              {s.demand}u
            </span>
            <button
              onClick={() => onRemove(s.id)}
              aria-label={`Remove ${s.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition hover:bg-red/10 hover:text-red"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {stops.length === 0 && (
          <li className="py-8 text-center text-[13px] text-ink-faint">
            No stops yet — press “Add Delivery” and tap the map.
          </li>
        )}
      </ul>
    </section>
  );
}

/* ---------------- Live Tracking ---------------- */
export function LiveTrackingView({
  stops,
  stopMarkers,
  incidents,
  routes,
}: {
  stops: Stop[];
  stopMarkers: Record<number, { color: string; label: string }>;
  incidents: Incident[];
  routes: VehicleRoute[];
}) {
  const [playing, setPlaying] = useState(true);
  const [clock, setClock] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setClock((c) => c + dt);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  // logical dispatch: trucks leave the depot in a staggered queue, each paced by its own route length
  const dispatch = useMemo(() => {
    const active = routes.filter((r) => r.stopIds.length > 0);
    return active.map((r, i) => {
      const dur = Math.min(30, Math.max(10, 10 + r.distanceKm * 0.4)); // seconds per loop
      const step = Math.max(1.6, dur / Math.max(1, active.length)); // queue spacing
      const dep = i * step;
      const p = clock < dep ? 0 : ((clock - dep) % dur) / dur;
      return { r, dep, dur, p, departed: clock >= dep - 1e-6 };
    });
  }, [routes, clock]);

  const progressMap = useMemo(() => {
    const m: Record<number, number> = {};
    dispatch.forEach((d) => (m[d.r.vehicleId] = d.p));
    return m;
  }, [dispatch]);

  const idle = routes.filter((r) => r.stopIds.length === 0);
  const unitsOnRoad = dispatch.reduce(
    (s, d) => s + d.r.stopIds.reduce((a, id) => a + (stops.find((x) => x.id === id)?.demand ?? 0), 0),
    0,
  );

  return (
    <div className="anim-up space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Live Tracking</h2>
          <p className="text-[12px] text-ink-faint">
            {dispatch.length} truck{dispatch.length !== 1 ? "s" : ""} on road · {unitsOnRoad} units · organized dispatch
            queue from {stops.length} stops
          </p>
        </div>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="flex items-center gap-2 rounded-lg bg-green px-4 py-2 text-[12px] font-bold text-white shadow-[0_3px_0_#0c7a37] transition active:translate-y-0.5 active:shadow-none"
        >
          {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? "Pause" : "Resume"}
        </button>
      </div>

      {/* dispatch board */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-line bg-card p-3 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        {dispatch.map((d) => (
          <span
            key={d.r.vehicleId}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] font-bold"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.r.color }} />
            T{d.r.label}
            <span className={d.departed ? "text-green-deep" : "text-ink-faint"}>
              {d.departed ? "en route" : "at depot"}
            </span>
          </span>
        ))}
        {idle.map((r) => (
          <span
            key={r.vehicleId}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1 font-mono text-[10px] font-bold text-ink-faint"
          >
            <span className="h-2.5 w-2.5 rounded-full border border-ink-faint" />
            T{r.label} idle
          </span>
        ))}
        {routes.length === 0 && <span className="text-[11px] text-ink-faint">no trucks — add stops first</span>}
      </div>

      <div className="relative isolate z-0 h-[52dvh] min-h-[340px] overflow-hidden rounded-xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <MapView
          stops={stops}
          stopMarkers={stopMarkers}
          incidents={incidents}
          routes={routes}
          addMode={false}
          onAddStop={() => {}}
          trackProgress={progressMap}
        />
      </div>
    </div>
  );
}

/* ---------------- New Delivery modal ---------------- */
export function DeliveryModal({
  point,
  defaultName,
  onCancel,
  onConfirm,
}: {
  point: { lat: number; lng: number };
  defaultName: string;
  onCancel: () => void;
  onConfirm: (name: string, units: number) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [units, setUnits] = useState(4);

  const submit = () => onConfirm(name.trim() || defaultName, units);

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/50 p-4 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="anim-up w-full max-w-sm rounded-t-2xl border border-line bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+18px)] shadow-2xl sm:rounded-xl sm:pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-bold text-ink">New delivery</h3>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-faint transition hover:bg-paper hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>
        <p className="mt-0.5 font-mono text-[10px] text-ink-faint">
          drop point {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
        </p>

        <label className="mt-4 block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">Delivery name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            maxLength={28}
            autoFocus
            placeholder="e.g. Customer 12, MG Road"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-3 text-[16px] font-medium text-ink outline-none transition focus:border-green focus:ring-2 focus:ring-green/25 sm:py-2.5 sm:text-[14px]"
          />
        </label>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2.5">
          <span className="text-[12px] font-semibold text-ink-soft">Units to deliver</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setUnits((u) => Math.max(1, u - 1))}
              aria-label="Fewer units"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white transition hover:bg-ink hover:text-white"
            >
              <Minus size={14} />
            </button>
            <span className="w-6 text-center font-mono text-[15px] font-bold text-ink">{units}</span>
            <button
              onClick={() => setUnits((u) => Math.min(20, u + 1))}
              aria-label="More units"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white transition hover:bg-ink hover:text-white"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line bg-white py-2.5 text-[13px] font-bold text-ink-soft transition hover:border-ink hover:text-ink"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-lg bg-green py-2.5 font-display text-[13px] font-bold text-white shadow-[0_3px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5 active:shadow-none"
          >
            Add Delivery
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- History ---------------- */
const STATUS_CONFIG: Record<
  RunStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  OPTIMAL: {
    label: "OPTIMAL",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  REROUTED: {
    label: "REROUTED",
    bg: "bg-blue-500/10",
    text: "text-blue-700",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
  },
  WAITING: {
    label: "WAITING",
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
  },
  ACCIDENT: {
    label: "ACCIDENT",
    bg: "bg-red-500/10",
    text: "text-red-700",
    border: "border-red-500/30",
    dot: "bg-red-500",
  },
  CLEARED: {
    label: "CLEARED",
    bg: "bg-teal-500/10",
    text: "text-teal-700",
    border: "border-teal-500/30",
    dot: "bg-teal-500",
  },
  OVERLOAD: {
    label: "OVERLOAD",
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    border: "border-rose-500/30",
    dot: "bg-rose-500",
  },
};

export function HistoryView({ log }: { log: RunEntry[] }) {
  return (
    <section className="anim-up overflow-hidden rounded-xl border border-line bg-card shadow-[0_2px_0_rgba(11,15,14,0.05)]">
      <div className="border-b border-line px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Optimization History</h2>
          <p className="text-[12px] text-ink-faint">Real-time status updates reflecting live traffic incidents, detours, and road situations.</p>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-soft border border-line">
          {log.length} {log.length === 1 ? "run" : "runs"} recorded
        </span>
      </div>
      {log.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-ink-faint">No runs yet — hit “Find Best Route”.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line bg-paper font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Situation / Trigger</th>
                <th className="px-4 py-2.5 text-center">Fleet</th>
                <th className="px-4 py-2.5 text-center">Stops</th>
                <th className="px-4 py-2.5 text-center">Incidents</th>
                <th className="px-4 py-2.5 text-right">Cost (min)</th>
              </tr>
            </thead>
            <tbody>
              {log.map((e, i) => {
                const conf = STATUS_CONFIG[e.status] ?? STATUS_CONFIG.OPTIMAL;
                return (
                  <tr
                    key={e.id}
                    className="anim-slide border-b border-line/60 text-[12px] transition hover:bg-green-tint/40"
                    style={{ animationDelay: `${i * 25}ms` }}
                  >
                    <td className="px-4 py-2.5 font-mono text-ink-faint whitespace-nowrap">{e.time}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold ${conf.bg} ${conf.text} ${conf.border}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
                        {conf.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">
                      {e.situation || (e.feasible ? "Free flow — optimal baseline" : "Over capacity")}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono text-ink">{e.fleet}</td>
                    <td className="px-4 py-2.5 text-center font-mono text-ink">{e.stops}</td>
                    <td className="px-4 py-2.5 text-center font-mono">
                      {e.incidents > 0 ? (
                        <span className="font-bold text-amber-600">{e.incidents} active</span>
                      ) : (
                        <span className="text-ink-faint">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-ink whitespace-nowrap">
                      {e.cost.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Settings ---------------- */
export function SettingsView({
  roadSnap,
  setRoadSnap,
}: {
  roadSnap: boolean;
  setRoadSnap: (b: boolean) => void;
}) {
  return (
    <div className="anim-up space-y-4">
      {/* QPSO Dedicated Engine Console */}
      <section className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green text-white shadow-sm">
              <Atom size={20} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink">Solver Engine: QPSO</h2>
              <p className="text-[12px] text-ink-faint">Quantum-Inspired Particle Swarm Optimization (Exclusive Core Engine)</p>
            </div>
          </div>
          <span className="rounded-full bg-green-tint px-2.5 py-1 font-mono text-[10px] font-bold text-green-deep">
            Active Core
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-line/70 bg-paper/60 p-3">
            <p className="text-[11px] font-semibold text-ink-soft">Quantum State Equation</p>
            <p className="mt-1 font-mono text-[11px] text-green-deep font-bold">
              X = P ± α · |mbest - X| · ln(1/u)
            </p>
            <p className="mt-1 text-[10px] text-ink-faint">Wave-function delta potential well</p>
          </div>

          <div className="rounded-lg border border-line/70 bg-paper/60 p-3">
            <p className="text-[11px] font-semibold text-ink-soft">α-Annealing Parameter</p>
            <p className="mt-1 font-mono text-[11px] text-ink font-bold">
              0.95 → 0.50 (linear cooling)
            </p>
            <p className="mt-1 text-[10px] text-ink-faint">Contraction-expansion annealing</p>
          </div>

          <div className="rounded-lg border border-line/70 bg-paper/60 p-3">
            <p className="text-[11px] font-semibold text-ink-soft">Memetic Hybrid Step</p>
            <p className="mt-1 font-mono text-[11px] text-ink font-bold">
              Intra-tour 2-Opt + Inter-relocate
            </p>
            <p className="mt-1 text-[10px] text-ink-faint">Monotone improving local search</p>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
          All fleet routing, traffic incident adaptation, and dynamic wait-vs-reroute comparisons are computed using
          pure QPSO with continuous random-key customer sequence encoding.
        </p>
      </section>

      <section className="flex items-center justify-between rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-tint text-green-deep">
            <MapPinned size={16} />
          </span>
          <div>
            <p className="text-[13px] font-bold text-ink">Road-snapped routes (OSRM)</p>
            <p className="text-[11px] text-ink-faint">Follow real OpenStreetMap roads instead of straight lines.</p>
          </div>
        </div>
        <button
          onClick={() => setRoadSnap(!roadSnap)}
          className={`relative h-7 w-12 rounded-full transition ${roadSnap ? "bg-green" : "bg-line"}`}
          aria-label="Toggle road snapping"
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${roadSnap ? "left-6" : "left-1"}`} />
        </button>
      </section>

      <section className="flex items-center gap-3 rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white">
          <Route size={16} />
        </span>
        <p className="text-[12px] leading-snug text-ink-soft">
          Routes, fleets and benchmarks reset automatically whenever the scenario changes — capacity is kept feasible
          for the selected fleet size.
        </p>
      </section>
    </div>
  );
}
