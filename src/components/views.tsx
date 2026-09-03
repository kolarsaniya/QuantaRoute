import { useEffect, useMemo, useRef, useState } from "react";
import { Atom, Dna, Gauge, MapPinned, Minus, Pause, Play, Plus, Route, Trash2, X } from "lucide-react";
import type { Algorithm, Incident, RunEntry, Stop, VehicleRoute } from "../lib/types";
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

      <ul className="mt-4 divide-y divide-line">
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
export function HistoryView({ log }: { log: RunEntry[] }) {
  return (
    <section className="anim-up overflow-hidden rounded-xl border border-line bg-card shadow-[0_2px_0_rgba(11,15,14,0.05)]">
      <div className="border-b border-line px-4 py-3">
        <h2 className="font-display text-lg font-bold text-ink">Optimization History</h2>
        <p className="text-[12px] text-ink-faint">Every solve this session, newest first.</p>
      </div>
      {log.length === 0 ? (
        <p className="px-4 py-10 text-center text-[13px] text-ink-faint">No runs yet — hit “Find Best Route”.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-paper font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Engine</th>
                <th className="px-4 py-2.5">Fleet</th>
                <th className="px-4 py-2.5">Stops</th>
                <th className="px-4 py-2.5">Incidents</th>
                <th className="px-4 py-2.5 text-right">Cost (min)</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {log.map((e, i) => (
                <tr key={e.id} className="anim-slide border-b border-line/60 text-[12px] transition hover:bg-green-tint/40" style={{ animationDelay: `${i * 25}ms` }}>
                  <td className="px-4 py-2.5 font-mono text-ink-faint">{e.time}</td>
                  <td className="px-4 py-2.5 font-bold text-green-deep">{e.algorithm}</td>
                  <td className="px-4 py-2.5 font-mono text-ink">{e.fleet}</td>
                  <td className="px-4 py-2.5 font-mono text-ink">{e.stops}</td>
                  <td className="px-4 py-2.5 font-mono text-ink">{e.incidents}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold text-ink">{e.cost.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${e.feasible ? "bg-green-tint text-green-deep" : "bg-red/10 text-red"}`}>
                      {e.feasible ? "OK" : "OVER"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------------- Settings ---------------- */
const ALGOS: { id: Algorithm; name: string; desc: string; icon: typeof Atom }[] = [
  { id: "QPSO", name: "Quantum PSO", desc: "Quantum Particle Swarm — strongest global search (default).", icon: Atom },
  { id: "PSO", name: "Classical PSO", desc: "Standard particle swarm velocity update baseline.", icon: Gauge },
  { id: "GA", name: "Genetic Algorithm", desc: "Evolutionary crossover + swap mutation baseline.", icon: Dna },
];

export function SettingsView({
  algorithm,
  setAlgorithm,
  roadSnap,
  setRoadSnap,
}: {
  algorithm: Algorithm;
  setAlgorithm: (a: Algorithm) => void;
  roadSnap: boolean;
  setRoadSnap: (b: boolean) => void;
}) {
  return (
    <div className="anim-up space-y-4">
      <section className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <h2 className="font-display text-lg font-bold text-ink">Solver engine</h2>
        <p className="text-[12px] text-ink-faint">Choose which metaheuristic dispatches your fleet.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {ALGOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAlgorithm(a.id)}
              className={`rounded-xl border p-3 text-left transition ${
                algorithm === a.id ? "border-green bg-green-tint shadow-[0_3px_0_#16a34a]" : "border-line bg-white hover:border-ink"
              }`}
            >
              <a.icon size={18} className={algorithm === a.id ? "text-green-deep" : "text-ink-faint"} />
              <p className="mt-2 font-display text-[13px] font-bold text-ink">{a.name}</p>
              <p className="mt-1 text-[11px] leading-snug text-ink-soft">{a.desc}</p>
            </button>
          ))}
        </div>
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
