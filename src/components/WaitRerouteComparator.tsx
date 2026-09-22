import { useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock,
  Fuel,
  GitCompare,
  Hourglass,
  Leaf,
  Navigation,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { WaitVsRerouteComparison } from "../lib/types";

interface Props {
  comparison: WaitVsRerouteComparison;
  activeMode: "reroute" | "wait";
  onSelectMode: (mode: "reroute" | "wait") => void;
  onAddTraffic: () => void;
  onAddAccident: () => void;
  onClearIncidents: () => void;
  solveMs: number | null;
}

export function WaitRerouteComparator({
  comparison,
  activeMode,
  onSelectMode,
  onAddTraffic,
  onAddAccident,
  onClearIncidents,
  solveMs,
}: Props) {
  const {
    hasIncident,
    incidentCount,
    waitOption,
    rerouteOption,
    recommendation,
    timeSavedMin,
    detourKm,
    fuelDiffLiters,
    co2DiffKg,
    summaryReason,
    vehicles,
  } = comparison;

  const [filterAffectedOnly, setFilterAffectedOnly] = useState(false);

  const displayedVehicles = filterAffectedOnly
    ? vehicles.filter((v) => v.isDirectlyAffected)
    : vehicles;

  const isRerouteBetter = recommendation === "REROUTE";
  const maxTime = Math.max(waitOption.timeMin, rerouteOption.timeMin, 1);
  const maxDist = Math.max(waitOption.distKm, rerouteOption.distKm, 1);
  const maxFuel = Math.max(waitOption.fuelLiters, rerouteOption.fuelLiters, 1);

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Top Header */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)] min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green text-white shadow-sm">
              <GitCompare size={18} />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-ink sm:text-lg">
                Calculate & Compare: WAIT vs. REROUTE
              </h2>
              <p className="text-[12px] text-ink-faint">
                Real-time trade-off between holding current schedules vs. dynamic QPSO detour optimization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {solveMs !== null && (
              <span className="rounded-full bg-paper px-2.5 py-1 font-mono text-[10px] font-bold text-ink-soft">
                QPSO: {solveMs} ms
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${
                hasIncident ? "bg-amber/20 text-amber" : "bg-green-tint text-green-deep"
              }`}
            >
              {hasIncident ? `${incidentCount} Active Disruption${incidentCount > 1 ? "s" : ""}` : "Roads Free-Flow"}
            </span>
          </div>
        </div>

        {/* What-If quick simulation bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
          <span className="text-[11px] font-semibold text-ink-soft">
            Test disruption scenarios:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={onAddTraffic}
              className="flex items-center gap-1.5 rounded-lg border border-amber/30 bg-amber/10 px-2.5 py-1 text-[11px] font-bold text-amber hover:bg-amber/20 transition active:scale-95"
            >
              <Car size={13} /> + Traffic Jam
            </button>
            <button
              onClick={onAddAccident}
              className="flex items-center gap-1.5 rounded-lg border border-red/30 bg-red/10 px-2.5 py-1 text-[11px] font-bold text-red hover:bg-red/20 transition active:scale-95"
            >
              <AlertTriangle size={13} /> + Road Accident
            </button>
            {hasIncident && (
              <button
                onClick={onClearIncidents}
                className="flex items-center gap-1 rounded-lg border border-line bg-paper px-2 py-1 text-[11px] font-medium text-ink-soft hover:text-red transition"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Decision Recommendation Banner */}
      <section
        className={`anim-pop overflow-hidden rounded-xl border p-4 sm:p-5 transition-all ${
          isRerouteBetter
            ? "border-green/40 bg-gradient-to-br from-green-tint/80 via-white to-green-tint/30 shadow-[0_4px_16px_rgba(22,163,74,0.12)]"
            : "border-amber/40 bg-gradient-to-br from-amber/10 via-white to-amber/5 shadow-[0_4px_16px_rgba(245,165,36,0.12)]"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-white ${
                  isRerouteBetter ? "bg-green" : "bg-amber"
                }`}
              >
                {isRerouteBetter ? <Sparkles size={14} /> : <Hourglass size={14} />}
              </span>
              <span
                className={`font-display text-xs font-bold uppercase tracking-wider ${
                  isRerouteBetter ? "text-green-deep" : "text-amber"
                }`}
              >
                Algorithmic Decision
              </span>
            </div>

            <h3 className="font-display text-lg font-bold text-ink sm:text-xl">
              {isRerouteBetter ? "REROUTE VIA QPSO RECOMMENDED" : "HOLD SCHEDULE & WAIT RECOMMENDED"}
            </h3>

            <p className="text-[12.5px] leading-relaxed text-ink-soft max-w-2xl">
              {summaryReason}
            </p>
          </div>

          {/* Quick Metrics Badge */}
          {hasIncident && (
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
              <div
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[12px] font-bold ${
                  timeSavedMin > 0 ? "bg-green text-white" : "bg-paper text-ink"
                }`}
              >
                <Clock size={13} />
                <span>
                  {timeSavedMin > 0
                    ? `Save ${timeSavedMin.toFixed(1)} min`
                    : `+${Math.abs(timeSavedMin).toFixed(1)} min wait`}
                </span>
              </div>

              {fuelDiffLiters !== 0 && (
                <div className="flex items-center gap-1 rounded-lg bg-white/80 border border-line px-2.5 py-1 font-mono text-[11px] font-semibold text-ink-soft">
                  <Fuel size={12} className="text-amber" />
                  <span>
                    {fuelDiffLiters > 0
                      ? `-${fuelDiffLiters.toFixed(1)} L fuel`
                      : `+${Math.abs(fuelDiffLiters).toFixed(1)} L fuel`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* OPTION 1: WAIT */}
        <div
          className={`relative rounded-xl border p-4 transition-all ${
            activeMode === "wait"
              ? "border-amber bg-amber/5 ring-2 ring-amber/30 shadow-md"
              : "border-line bg-card hover:border-ink/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber/15 text-amber">
                <Hourglass size={16} />
              </span>
              <div>
                <h4 className="font-display text-[14px] font-bold text-ink">Option 1: WAIT</h4>
                <p className="text-[11px] text-ink-faint">Maintain planned stop sequence</p>
              </div>
            </div>
            {recommendation === "WAIT" && (
              <span className="flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber">
                <CheckCircle2 size={11} /> Recommended
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Clock size={11} /> Total Travel Time
              </p>
              <p className="font-mono text-base font-bold text-ink">
                {waitOption.timeMin.toFixed(1)} <span className="text-[11px] font-normal">min</span>
              </p>
              {waitOption.delayMin > 0 && (
                <p className="font-mono text-[10px] text-red font-semibold">
                  +{waitOption.delayMin.toFixed(1)} min congestion
                </p>
              )}
            </div>

            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Navigation size={11} /> Total Distance
              </p>
              <p className="font-mono text-base font-bold text-ink">
                {waitOption.distKm.toFixed(1)} <span className="text-[11px] font-normal">km</span>
              </p>
              <p className="font-mono text-[10px] text-ink-faint">direct route (0 km detour)</p>
            </div>

            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Fuel size={11} /> Fuel Consumption
              </p>
              <p className="font-mono text-base font-bold text-ink">
                {waitOption.fuelLiters.toFixed(1)} <span className="text-[11px] font-normal">L</span>
              </p>
              {waitOption.delayMin > 0 && (
                <p className="font-mono text-[10px] text-amber font-semibold">includes idle burn</p>
              )}
            </div>

            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Leaf size={11} /> CO₂ Footprint
              </p>
              <p className="font-mono text-base font-bold text-ink">
                {waitOption.co2Kg.toFixed(1)} <span className="text-[11px] font-normal">kg</span>
              </p>
              <p className="font-mono text-[10px] text-ink-faint">direct emission</p>
            </div>
          </div>

          <button
            onClick={() => onSelectMode("wait")}
            className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-bold transition ${
              activeMode === "wait"
                ? "bg-amber text-ink shadow-[0_3px_0_#c47f0a]"
                : "border border-line bg-paper text-ink-soft hover:bg-ink hover:text-white"
            }`}
          >
            <Hourglass size={14} />
            {activeMode === "wait" ? "Active Map Display: WAIT" : "Display WAIT Route on Map"}
          </button>
        </div>

        {/* OPTION 2: REROUTE */}
        <div
          className={`relative rounded-xl border p-4 transition-all ${
            activeMode === "reroute"
              ? "border-green bg-green-tint/30 ring-2 ring-green/30 shadow-md"
              : "border-line bg-card hover:border-ink/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green text-white">
                <Navigation size={16} />
              </span>
              <div>
                <h4 className="font-display text-[14px] font-bold text-ink">Option 2: REROUTE</h4>
                <p className="text-[11px] text-ink-faint">Quantum PSO dynamic detour</p>
              </div>
            </div>
            {recommendation === "REROUTE" && (
              <span className="flex items-center gap-1 rounded-full bg-green text-white px-2.5 py-0.5 font-mono text-[10px] font-bold">
                <CheckCircle2 size={11} /> Recommended
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Clock size={11} /> Total Travel Time
              </p>
              <p className="font-mono text-base font-bold text-green-deep">
                {rerouteOption.timeMin.toFixed(1)} <span className="text-[11px] font-normal">min</span>
              </p>
              {timeSavedMin > 0 ? (
                <p className="font-mono text-[10px] text-green-deep font-bold">
                  -{timeSavedMin.toFixed(1)} min faster
                </p>
              ) : (
                <p className="font-mono text-[10px] text-ink-faint">same as baseline</p>
              )}
            </div>

            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Navigation size={11} /> Total Distance
              </p>
              <p className="font-mono text-base font-bold text-ink">
                {rerouteOption.distKm.toFixed(1)} <span className="text-[11px] font-normal">km</span>
              </p>
              {detourKm > 0 ? (
                <p className="font-mono text-[10px] text-ink-faint font-semibold">
                  +{detourKm.toFixed(1)} km detour
                </p>
              ) : (
                <p className="font-mono text-[10px] text-ink-faint">no detour</p>
              )}
            </div>

            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Fuel size={11} /> Fuel Consumption
              </p>
              <p className="font-mono text-base font-bold text-ink">
                {rerouteOption.fuelLiters.toFixed(1)} <span className="text-[11px] font-normal">L</span>
              </p>
              {fuelDiffLiters > 0.1 ? (
                <p className="font-mono text-[10px] text-green-deep font-semibold">
                  -{fuelDiffLiters.toFixed(1)} L saved
                </p>
              ) : (
                <p className="font-mono text-[10px] text-ink-faint">active driving burn</p>
              )}
            </div>

            <div className="rounded-lg border border-line/60 bg-paper/60 p-2.5">
              <p className="flex items-center gap-1 text-[10px] font-semibold text-ink-faint">
                <Leaf size={11} /> CO₂ Footprint
              </p>
              <p className="font-mono text-base font-bold text-ink">
                {rerouteOption.co2Kg.toFixed(1)} <span className="text-[11px] font-normal">kg</span>
              </p>
              {co2DiffKg > 0.1 ? (
                <p className="font-mono text-[10px] text-green-deep font-semibold">
                  -{co2DiffKg.toFixed(1)} kg saved
                </p>
              ) : (
                <p className="font-mono text-[10px] text-ink-faint">cleaner flow</p>
              )}
            </div>
          </div>

          <button
            onClick={() => onSelectMode("reroute")}
            className={`mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-bold transition ${
              activeMode === "reroute"
                ? "bg-green text-white shadow-[0_3px_0_#0c7a37]"
                : "border border-line bg-paper text-ink-soft hover:bg-green hover:text-white"
            }`}
          >
            <Navigation size={14} />
            {activeMode === "reroute" ? "Active Map Display: REROUTE" : "Display REROUTE on Map"}
          </button>
        </div>
      </div>

      {/* Visual Metric Delta Bars */}
      <section className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <h3 className="font-display text-[13px] font-bold uppercase tracking-wide text-ink mb-3">
          Direct Trade-Off Comparison
        </h3>

        <div className="space-y-3">
          {/* Time bar */}
          <div>
            <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-ink-soft mb-1 gap-1">
              <span className="flex items-center gap-1 shrink-0">
                <Clock size={12} /> Total Travel Time
              </span>
              <span className="font-mono text-[10px] sm:text-[11px]">
                WAIT: {waitOption.timeMin.toFixed(0)}m vs REROUTE: {rerouteOption.timeMin.toFixed(0)}m
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 h-3">
              <div className="h-full rounded-sm bg-paper overflow-hidden flex justify-end">
                <div
                  className="h-full bg-amber transition-all duration-500 rounded-sm"
                  style={{ width: `${(waitOption.timeMin / maxTime) * 100}%` }}
                />
              </div>
              <div className="h-full rounded-sm bg-paper overflow-hidden">
                <div
                  className="h-full bg-green transition-all duration-500 rounded-sm"
                  style={{ width: `${(rerouteOption.timeMin / maxTime) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Distance bar */}
          <div>
            <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-ink-soft mb-1 gap-1">
              <span className="flex items-center gap-1 shrink-0">
                <Navigation size={12} /> Total Fleet Distance
              </span>
              <span className="font-mono text-[10px] sm:text-[11px]">
                WAIT: {waitOption.distKm.toFixed(1)}km vs REROUTE: {rerouteOption.distKm.toFixed(1)}km
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 h-3">
              <div className="h-full rounded-sm bg-paper overflow-hidden flex justify-end">
                <div
                  className="h-full bg-ink-faint transition-all duration-500 rounded-sm"
                  style={{ width: `${(waitOption.distKm / maxDist) * 100}%` }}
                />
              </div>
              <div className="h-full rounded-sm bg-paper overflow-hidden">
                <div
                  className="h-full bg-green transition-all duration-500 rounded-sm"
                  style={{ width: `${(rerouteOption.distKm / maxDist) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fuel bar */}
          <div>
            <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-ink-soft mb-1 gap-1">
              <span className="flex items-center gap-1 shrink-0">
                <Fuel size={12} /> Fuel & Emissions
              </span>
              <span className="font-mono text-[10px] sm:text-[11px]">
                WAIT: {waitOption.fuelLiters.toFixed(1)}L vs REROUTE: {rerouteOption.fuelLiters.toFixed(1)}L
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 h-3">
              <div className="h-full rounded-sm bg-paper overflow-hidden flex justify-end">
                <div
                  className="h-full bg-amber transition-all duration-500 rounded-sm"
                  style={{ width: `${(waitOption.fuelLiters / maxFuel) * 100}%` }}
                />
              </div>
              <div className="h-full rounded-sm bg-paper overflow-hidden">
                <div
                  className="h-full bg-green transition-all duration-500 rounded-sm"
                  style={{ width: `${(rerouteOption.fuelLiters / maxFuel) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[10px] text-ink-faint font-mono">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-amber" /> Left: WAIT (holding course)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-green" /> Right: REROUTE (QPSO)
          </span>
        </div>
      </section>

      {/* Vehicle-by-Vehicle Breakdown */}
      <section className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)] min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="font-display text-[14px] font-bold text-ink">
              Fleet Breakdown ({vehicles.length} Trucks)
            </h3>
            <p className="text-[11px] text-ink-faint">
              Inspect how each truck is individually impacted by congestion.
            </p>
          </div>

          <button
            onClick={() => setFilterAffectedOnly((f) => !f)}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] font-semibold transition ${
              filterAffectedOnly
                ? "border-green bg-green-tint text-green-deep"
                : "border-line bg-paper text-ink-soft hover:border-ink"
            }`}
          >
            {filterAffectedOnly ? "Show All Trucks" : "Show Congested Only"}
          </button>
        </div>

        <div className="overflow-x-auto min-w-0 max-w-full -mx-1 px-1">
          <table className="min-w-[520px] w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-paper font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-3 py-2">Truck</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Wait Time</th>
                <th className="px-3 py-2">Reroute Time</th>
                <th className="px-3 py-2">Detour (km)</th>
                <th className="px-3 py-2 text-right">Time Delta</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono text-[11px]">
              {displayedVehicles.map((v) => {
                const savings = v.timeSavingsMin;
                return (
                  <tr key={v.vehicleId} className="hover:bg-paper/50 transition">
                    <td className="px-3 py-2.5 font-bold flex items-center gap-2 text-ink">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: v.color }}
                      />
                      Truck {v.label}
                    </td>
                    <td className="px-3 py-2.5">
                      {v.isDirectlyAffected ? (
                        <span className="rounded bg-red/10 px-1.5 py-0.5 text-[9px] font-bold text-red">
                          In Jam Zone
                        </span>
                      ) : (
                        <span className="rounded bg-green-tint px-1.5 py-0.5 text-[9px] font-semibold text-green-deep">
                          Clear Road
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-ink">{v.waitTimeMin.toFixed(0)} min</td>
                    <td className="px-3 py-2.5 text-ink">{v.rerouteTimeMin.toFixed(0)} min</td>
                    <td className="px-3 py-2.5 text-ink-soft">
                      {v.detourDistKm > 0.1 ? `+${v.detourDistKm.toFixed(1)} km` : "0 km"}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-bold ${
                        savings > 0.5
                          ? "text-green-deep"
                          : savings < -0.5
                            ? "text-amber"
                            : "text-ink-faint"
                      }`}
                    >
                      {savings > 0 ? `-${savings.toFixed(1)}m` : savings < 0 ? `+${Math.abs(savings).toFixed(1)}m` : "0m"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          v.recommendation === "REROUTE"
                            ? "bg-green text-white"
                            : "bg-paper text-ink-soft border border-line"
                        }`}
                      >
                        {v.recommendation}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
