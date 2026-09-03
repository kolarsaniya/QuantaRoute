import { Clock, MapPin, Package, Warehouse } from "lucide-react";
import type { Solution } from "../lib/types";
import { capacityFor, DEPOT, STOPS } from "../lib/network";

interface Props {
  solution: Solution | null;
  fleet: number;
}

export function FleetRoutes({ solution, fleet }: Props) {
  const cap = capacityFor(fleet);
  return (
    <section className="anim-up" style={{ animationDelay: "120ms" }}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink">Optimized fleet routes</h2>
        {solution && (
          <span className="rounded-full bg-green px-2 py-0.5 font-mono text-[10px] font-bold text-white">
            {solution.feasible ? "FEASIBLE" : "OVER CAPACITY"}
          </span>
        )}
      </div>

      {!solution && (
        <div className="rounded-xl border border-dashed border-line bg-card p-6 text-center text-[13px] text-ink-faint">
          Run the optimizer to generate routes.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {solution?.vehicles.map((v, i) => (
          <article
            key={v.vehicleId}
            className="anim-pop group rounded-xl border border-line bg-card p-3.5 transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(14,17,22,0.08)]"
            style={{ animationDelay: `${i * 70}ms`, borderTop: `3px solid ${v.color}` }}
          >
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg font-display text-sm font-bold text-white"
                  style={{ background: v.color }}
                >
                  {v.label}
                </span>
                <div>
                  <p className="text-[13px] font-bold text-ink">Fleet {v.label}</p>
                  <p className="font-mono text-[10px] text-ink-faint">
                    {v.stopIds.length} stops · {v.distanceKm.toFixed(1)} km
                  </p>
                </div>
              </div>
              <span
                className="flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] font-bold"
                style={{ background: `${v.color}14`, color: v.color }}
              >
                <Clock size={11} /> {v.timeMin.toFixed(0)}m
              </span>
            </header>

            {/* load bar */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, (v.load / cap) * 100)}%`,
                  background: v.color,
                }}
              />
            </div>
            <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-ink-faint">
              <Package size={10} /> load {v.load}/{cap} units
            </p>

            {/* stop sequence */}
            <ol className="mt-3 space-y-1.5">
              <li className="flex items-center gap-2 text-[12px] text-ink-soft">
                <Warehouse size={12} style={{ color: v.color }} />
                <span className="font-medium">{DEPOT.name}</span>
                <span className="ml-auto font-mono text-[10px] text-ink-faint">depart</span>
              </li>
              {v.stopIds.map((id, idx) => (
                <li key={id} className="flex items-center gap-2 text-[12px] text-ink-soft">
                  <span
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white"
                    style={{ background: v.color }}
                  >
                    {idx + 1}
                  </span>
                  <MapPin size={11} className="text-ink-faint" />
                  <span className="font-medium">{STOPS[id].name}</span>
                  <span className="ml-auto font-mono text-[10px] text-ink-faint">{STOPS[id].demand}u</span>
                </li>
              ))}
              {v.stopIds.length === 0 && (
                <li className="text-[11px] italic text-ink-faint">idle — no stops assigned</li>
              )}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
