import {
  AlertTriangle,
  ArrowRight,
  Car,
  Clock,
  Fuel,
  Leaf,
  Loader2,
  MapPin,
  Navigation,
  Package,
  Trash2,
  Truck,
  Warehouse,
  X,
} from "lucide-react";
import type { AlertData, Solution, Stop } from "../lib/types";
import { capacityFor, DEPOT } from "../lib/network";

/* ---------------- incident simulation bar ---------------- */
export function IncidentBar({
  count,
  onTraffic,
  onAccident,
  onClear,
}: {
  count: number;
  onTraffic: () => void;
  onAccident: () => void;
  onClear: () => void;
}) {
  return (
    <section className="anim-up rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]" style={{ animationDelay: "140ms" }}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[14px] font-bold text-ink">Simulate road events</h2>
        <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-ink-soft">
          {count} active
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-ink-faint">
        Inject live congestion or a blocked road — the QPSO engine re-routes every fleet instantly.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={onTraffic}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber py-3 text-[12px] font-bold text-ink shadow-[0_3px_0_#c47f0a] transition active:translate-y-0.5 active:shadow-none"
        >
          <Car size={14} /> Traffic jam
        </button>
        <button
          onClick={onAccident}
          className="flex items-center justify-center gap-2 rounded-lg bg-red py-3 text-[12px] font-bold text-white shadow-[0_3px_0_#b32b30] transition active:translate-y-0.5 active:shadow-none"
        >
          <AlertTriangle size={14} /> Accident
        </button>
      </div>
      <button
        onClick={onClear}
        disabled={count === 0}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white py-2 text-[11px] font-semibold text-ink-soft transition hover:border-red hover:text-red disabled:opacity-35 disabled:hover:border-line disabled:hover:text-ink-soft"
      >
        <Trash2 size={12} /> Clear all incidents
      </button>
    </section>
  );
}

/* ---------------- top info cards ---------------- */
export function InfoCards({ stops, fleet }: { stops: Stop[]; fleet: number }) {
  const totalUnits = stops.reduce((s, x) => s + x.demand, 0);
  const cards = [
    {
      icon: MapPin,
      tint: "bg-green-tint text-green",
      label: "Start Location",
      title: DEPOT.name,
      sub: "Bengaluru, Karnataka",
    },
    {
      icon: Package,
      tint: "bg-ink text-white",
      label: "Today's Deliveries",
      title: String(stops.length),
      sub: `${totalUnits} units to visit`,
    },
    {
      icon: Truck,
      tint: "bg-green text-white",
      label: "Vehicle",
      title: `${fleet} Truck${fleet > 1 ? "s" : ""}`,
      sub: `Max ${capacityFor(fleet, stops)} units each`,
    },
  ];
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className="anim-up flex min-w-[220px] snap-start items-center gap-3 rounded-xl border border-line bg-card p-3.5 shadow-[0_2px_0_rgba(11,15,14,0.05)] sm:min-w-0"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.tint}`}>
            <c.icon size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-ink-faint">{c.label}</p>
            <p className="truncate font-display text-[15px] font-bold text-ink">{c.title}</p>
            <p className="truncate text-[11px] text-ink-faint">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- bottom stats strip ---------------- */
export function StatsStrip({
  solution,
  solving,
  onOptimize,
}: {
  solution: Solution | null;
  solving: boolean;
  onOptimize: () => void;
}) {
  const dist = solution?.totalDistanceKm ?? 0;
  const fuel = dist * 0.11;
  const co2 = fuel * 2.3;
  const items = [
    { icon: Navigation, tint: "bg-green-tint text-green", label: "Total Distance", value: solution ? `${dist.toFixed(1)} km` : "—" },
    { icon: Clock, tint: "bg-ink/8 text-ink", label: "Estimated Time", value: solution ? `${solution.totalTimeMin.toFixed(0)} min` : "—" },
    { icon: Fuel, tint: "bg-amber/15 text-amber", label: "Fuel Saving", value: solution ? `${fuel.toFixed(1)} L` : "—" },
    { icon: Leaf, tint: "bg-green-tint text-green-deep", label: "Emission Saved", value: solution ? `${co2.toFixed(1)} kg CO₂` : "—" },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-line bg-card px-4 py-3.5 shadow-[0_2px_0_rgba(11,15,14,0.05)] sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3 sm:py-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2.5">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${it.tint}`}>
            <it.icon size={16} />
          </span>
          <div className="leading-tight">
            <p className="text-[10px] font-semibold text-ink-faint">{it.label}</p>
            <p key={it.value} className="anim-pop font-mono text-[14px] font-bold text-ink">{it.value}</p>
          </div>
        </div>
      ))}
      <button
        onClick={onOptimize}
        disabled={solving}
        className="col-span-2 flex items-center justify-center gap-2 rounded-lg bg-green px-5 py-3.5 font-display text-[13px] font-bold tracking-wide text-white shadow-[0_4px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5 active:shadow-[0_2px_0_#0c7a37] disabled:opacity-70 sm:col-span-1 sm:ml-auto sm:w-auto sm:py-3"
      >
        {solving ? <Loader2 size={15} className="qr-spin" /> : <Navigation size={15} />}
        {solving ? "SOLVING…" : "FIND BEST ROUTE"}
      </button>
    </div>
  );
}

/* ---------------- today's best route (per fleet) ---------------- */
export function BestRoutePanel({
  solution,
  stops,
  selected,
  setSelected,
}: {
  solution: Solution | null;
  stops: Stop[];
  selected: number;
  setSelected: (i: number) => void;
}) {
  const active = solution?.vehicles.filter((v) => v.stopIds.length > 0) ?? [];
  const current = solution?.vehicles[Math.min(selected, (solution?.vehicles.length ?? 1) - 1)];

  return (
    <section className="anim-up rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]" style={{ animationDelay: "80ms" }}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[14px] font-bold text-ink">Today's Best Route</h2>
        <span className="font-mono text-[10px] text-ink-faint">{active.length} active trucks</span>
      </div>

      {/* fleet tabs */}
      <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {solution?.vehicles.map((v) => (
          <button
            key={v.vehicleId}
            onClick={() => setSelected(v.vehicleId)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-bold transition ${
              current?.vehicleId === v.vehicleId
                ? "border-transparent text-white"
                : "border-line bg-paper text-ink-soft hover:border-ink"
            }`}
            style={current?.vehicleId === v.vehicleId ? { background: v.color } : undefined}
          >
            <Truck size={12} /> T{v.label}
          </button>
        ))}
        {!solution && <span className="text-[11px] text-ink-faint">awaiting solve…</span>}
      </div>

      {/* timeline */}
      {current && (
        <ol className="mt-4">
          <li className="relative flex gap-3 pb-4">
            <span className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-white">
              <Warehouse size={12} />
            </span>
            {current.stopIds.length > 0 && <span className="absolute left-3 top-7 h-full w-0.5 bg-line" />}
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-ink">Start</p>
              <p className="text-[11px] text-ink-faint">{DEPOT.name}, Bengaluru</p>
            </div>
          </li>
          {current.stopIds.map((id, idx) => {
            const s = stops.find((x) => x.id === id);
            const last = idx === current.stopIds.length - 1;
            return (
              <li key={id} className="relative flex gap-3 pb-4">
                <span
                  className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-white"
                  style={{ background: current.color }}
                >
                  {idx + 1}
                </span>
                {!last && <span className="absolute left-3 top-7 h-full w-0.5 bg-line" />}
                <div className="leading-tight">
                  <p className="text-[13px] font-bold text-ink">{s?.name ?? `Stop ${id}`}</p>
                  <p className="text-[11px] text-ink-faint">{s?.demand ?? "—"} units · drop {idx + 1}</p>
                </div>
              </li>
            );
          })}
          {current.stopIds.length === 0 && (
            <li className="pl-9 text-[12px] italic text-ink-faint">Truck {current.label} is idle this run.</li>
          )}
        </ol>
      )}

      {current && (
        <div className="mt-2 flex items-center gap-3 border-t border-line pt-3">
          <span className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-ink">
            <Navigation size={12} className="text-ink-faint" /> {current.distanceKm.toFixed(1)} km
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-ink">
            <Clock size={12} className="text-ink-faint" /> {current.timeMin.toFixed(0)} min
          </span>
          <span className="ml-auto rounded-full bg-green-tint px-2.5 py-1 text-[10px] font-bold text-green-deep">
            Optimized
          </span>
        </div>
      )}
    </section>
  );
}

/* ---------------- traffic alert ---------------- */
export function TrafficAlertCard({ alert, onView }: { alert: AlertData | null; onView: () => void }) {
  if (!alert) return null;
  const worse = alert.next > alert.prev;
  return (
    <section className="anim-pop rounded-xl border border-red/30 bg-red/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red text-white">
          {alert.kind === "accident" ? <X size={16} /> : <Truck size={16} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[14px] font-bold text-red">
            {alert.kind === "accident" ? "Accident Alert" : "Traffic Alert"}
          </h3>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">
            {alert.kind === "accident" ? `Road blocked near ${alert.place}.` : `Heavy congestion near ${alert.place}.`}{" "}
            Fleets were re-routed automatically.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4 rounded-lg border border-red/20 bg-white px-4 py-2.5">
        <div className="text-center">
          <p className="text-[10px] font-semibold text-ink-faint">Previous Time</p>
          <p className="font-mono text-[15px] font-bold text-ink">{alert.prev.toFixed(0)} min</p>
        </div>
        <ArrowRight size={16} className="text-ink-faint" />
        <div className="text-center">
          <p className="text-[10px] font-semibold text-ink-faint">New Time</p>
          <p className={`font-mono text-[15px] font-bold ${worse ? "text-red" : "text-green-deep"}`}>
            {alert.next.toFixed(0)} min
          </p>
        </div>
      </div>
      <button
        onClick={onView}
        className="mt-3 w-full rounded-lg bg-red py-2.5 font-display text-[12px] font-bold tracking-wide text-white shadow-[0_3px_0_#b32b30] transition active:translate-y-0.5 active:shadow-none"
      >
        VIEW NEW ROUTE
      </button>
    </section>
  );
}
