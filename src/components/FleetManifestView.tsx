import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  MapPin,
  Package,
  Printer,
  ShieldAlert,
  Truck,
  Warehouse,
} from "lucide-react";
import { DRIVER_ROSTER } from "./FleetManagerDashboard";
import { DEPOT } from "../lib/network";
import type { Stop, VehicleRoute } from "../lib/types";

interface Props {
  routes: VehicleRoute[];
  stops: Stop[];
  onToast?: (msg: string, tone: "traffic" | "accident" | "info") => void;
}

export function FleetManifestView({ routes, stops, onToast }: Props) {
  // Track delivered stop IDs
  const [completedStops, setCompletedStops] = useState<Record<number, boolean>>({});

  const toggleStop = (id: number) => {
    setCompletedStops((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const stop = stops.find((s) => s.id === id);
      if (next[id]) {
        onToast?.(`Delivery at ${stop?.name ?? `Stop #${id}`} marked as COMPLETED`, "info");
      }
      return next;
    });
  };

  const totalStops = stops.length;
  const completedCount = Object.values(completedStops).filter(Boolean).length;
  const progressPct = totalStops > 0 ? Math.round((completedCount / totalStops) * 100) : 0;

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Header */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green text-white text-[12px] font-bold">
                <FileText size={15} />
              </span>
              <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                Dispatch Manifest & Stop Checklists
              </h2>
            </div>
            <p className="mt-1 text-[12px] text-ink-soft">
              Real-time delivery verification, customer drop sequences, and proof-of-delivery checkoffs for each vehicle route.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const all: Record<number, boolean> = {};
                stops.forEach((s) => (all[s.id] = true));
                setCompletedStops(all);
                onToast?.("All current stops marked as completed!", "info");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-paper px-3 py-2 text-[11px] font-bold text-ink transition hover:border-ink"
            >
              <CheckCircle2 size={13} /> Mark All Complete
            </button>
            <button
              onClick={() => onToast?.("Exporting Dispatch Manifest to CSV...", "info")}
              className="flex items-center gap-1.5 rounded-lg bg-green px-3.5 py-2 text-[11px] font-bold text-white shadow-[0_2px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5"
            >
              <Download size={13} /> Export Manifest
            </button>
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div className="mt-4 rounded-xl border border-line/60 bg-paper/60 p-3.5">
          <div className="flex items-center justify-between text-[12px] font-semibold text-ink mb-1.5">
            <span className="flex items-center gap-1.5">
              <Package size={14} className="text-green" /> Overall Dispatch Completion
            </span>
            <span className="font-mono text-green-deep font-bold">
              {completedCount} of {totalStops} Drops Delivered ({progressPct}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-line overflow-hidden">
            <div
              className="h-full bg-green rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Manifest Tables Grouped by Vehicle */}
      <div className="space-y-4">
        {routes.map((v, i) => {
          const driver = DRIVER_ROSTER[v.vehicleId] ?? DRIVER_ROSTER[i % 5];
          const vehicleStops = v.stopIds
            .map((id) => stops.find((s) => s.id === id))
            .filter((s): s is Stop => Boolean(s));

          const vehicleCompleted = vehicleStops.filter((s) => completedStops[s.id]).length;

          return (
            <div
              key={v.vehicleId}
              className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]"
            >
              {/* Manifest Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-mono text-[13px] font-bold shadow-sm"
                    style={{ backgroundColor: v.color }}
                  >
                    T{v.label}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-[15px] font-bold text-ink">
                        Truck {v.label} Manifest
                      </h3>
                      <span className="rounded bg-paper px-2 py-0.5 font-mono text-[10px] text-ink-faint border border-line">
                        {driver.plate}
                      </span>
                    </div>
                    <p className="text-[12px] text-ink-soft">
                      Driver: <strong>{driver.name}</strong> ({driver.phone}) · {driver.vehicleModel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-green-tint border border-green/30 px-3 py-1 font-mono text-[11px] font-bold text-green-deep">
                    {vehicleCompleted}/{vehicleStops.length} Completed
                  </span>
                  <span className="rounded-lg bg-paper border border-line px-3 py-1 font-mono text-[11px] font-semibold text-ink-soft">
                    {v.load} Units Total
                  </span>
                </div>
              </div>

              {/* Start Depot Origin row */}
              <div className="my-3 flex items-center justify-between rounded-xl border border-green/30 bg-green-tint/40 px-3 py-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <Warehouse size={15} className="text-green" />
                  <span className="font-bold text-ink">Start Hub: {DEPOT.name}</span>
                  <span className="text-ink-faint font-mono text-[10px]">
                    Departed with {v.load} units
                  </span>
                </div>
                <span className="rounded-full bg-green text-white font-mono text-[9px] font-bold px-2 py-0.5 uppercase">
                  Departed 08:30 AM
                </span>
              </div>

              {/* Stop Checklist Table */}
              <div className="overflow-x-auto min-w-0 max-w-full">
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-line bg-paper font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                      <th className="px-3 py-2 w-12">Seq</th>
                      <th className="px-3 py-2">Customer Destination</th>
                      <th className="px-3 py-2">Demand Units</th>
                      <th className="px-3 py-2">Est. Window</th>
                      <th className="px-3 py-2">Priority</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {vehicleStops.map((stop, seq) => {
                      const isDone = Boolean(completedStops[stop.id]);
                      const priority = stop.demand >= 6 ? "High Cargo" : "Standard Delivery";

                      return (
                        <tr
                          key={stop.id}
                          className={`transition ${isDone ? "bg-green-tint/20 text-ink/60" : "hover:bg-paper/50"}`}
                        >
                          <td className="px-3 py-2.5 font-mono font-bold text-ink">
                            #{seq + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className={`font-bold ${isDone ? "line-through text-ink-faint" : "text-ink"}`}>
                              {stop.name}
                            </p>
                            <p className="font-mono text-[10px] text-ink-faint">
                              {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-semibold">
                            {stop.demand} units
                          </td>
                          <td className="px-3 py-2.5 font-mono text-ink-soft">
                            {String(9 + seq).padStart(2, "0")}:{(15 + seq * 12) % 60 < 10 ? `0${(15 + seq * 12) % 60}` : (15 + seq * 12) % 60} AM
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
                                stop.demand >= 6
                                  ? "bg-amber/15 text-amber"
                                  : "bg-paper text-ink-faint border border-line"
                              }`}
                            >
                              {priority}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() => toggleStop(stop.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                                isDone
                                  ? "bg-green text-white shadow-sm"
                                  : "border border-line bg-white text-ink hover:border-green hover:text-green"
                              }`}
                            >
                              {isDone ? <Check size={12} /> : null}
                              {isDone ? "Delivered" : "Mark Done"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Return to Depot row */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-paper/50 px-3 py-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <Warehouse size={15} className="text-ink-soft" />
                  <span className="font-bold text-ink">Return Hub: {DEPOT.name}</span>
                  <span className="text-ink-faint font-mono text-[10px]">
                    Shift completion and recharge
                  </span>
                </div>
                <span className="font-mono text-[10px] text-ink-soft">
                  Est. 12:45 PM
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
