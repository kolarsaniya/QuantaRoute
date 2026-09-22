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
  Truck,
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
  driverVehicleId?: number;
  driverName?: string;
}

export function WaitRerouteComparator({
  comparison,
  activeMode,
  onSelectMode,
  onAddTraffic,
  onAddAccident,
  onClearIncidents,
  solveMs,
  driverVehicleId,
  driverName,
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

  // Driver route isolation
  const isDriverView = driverVehicleId !== undefined;
  const driverVehicle = isDriverView
    ? vehicles.find((v) => v.vehicleId === driverVehicleId) || vehicles[0]
    : null;

  const displayedVehicles = isDriverView
    ? driverVehicle ? [driverVehicle] : []
    : filterAffectedOnly
      ? vehicles.filter((v) => v.isDirectlyAffected)
      : vehicles;

  // Active metrics: isolated to driver vehicle if in driver mode
  const effectiveRecommendation = isDriverView && driverVehicle
    ? driverVehicle.recommendation
    : recommendation;
  const effectiveTimeSaved = isDriverView && driverVehicle
    ? driverVehicle.timeSavingsMin
    : timeSavedMin;
  const effectiveWaitTime = isDriverView && driverVehicle
    ? driverVehicle.waitTimeMin
    : waitOption.timeMin;
  const effectiveRerouteTime = isDriverView && driverVehicle
    ? driverVehicle.rerouteTimeMin
    : rerouteOption.timeMin;
  const effectiveWaitDist = isDriverView && driverVehicle
    ? driverVehicle.waitDistKm
    : waitOption.distKm;
  const effectiveRerouteDist = isDriverView && driverVehicle
    ? driverVehicle.rerouteDistKm
    : rerouteOption.distKm;
  const effectiveDetourKm = isDriverView && driverVehicle
    ? driverVehicle.detourDistKm
    : detourKm;

  const isRerouteBetter = effectiveRecommendation === "REROUTE";
  const maxTime = Math.max(effectiveWaitTime, effectiveRerouteTime, 1);
  const maxDist = Math.max(effectiveWaitDist, effectiveRerouteDist, 1);
  const maxFuel = Math.max(waitOption.fuelLiters, rerouteOption.fuelLiters, 1);

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Top Header */}
      <div className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)] min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green text-white shadow-sm">
              {isDriverView ? <Truck size={18} /> : <GitCompare size={18} />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-base font-bold text-ink sm:text-lg">
                  {isDriverView && driverVehicle
                    ? `Vehicle #${driverVehicle.label} · WAIT vs. REROUTE`
                    : "Calculate & Compare: WAIT vs. REROUTE"}
                </h2>
                {isDriverView && (
                  <span className="rounded-full bg-green/15 px-2 py-0.5 font-mono text-[10px] font-bold text-green-deep border border-green/30">
                    Your Route Only
                  </span>
                )}
              </div>
              <p className="text-[12px] text-ink-faint">
                {isDriverView
                  ? `Driver: ${driverName || "Rajesh Kumar"} · Live navigation delay & detour analysis for your truck`
                  : "Real-time trade-off between holding current schedules vs. dynamic QPSO detour optimization."}
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
                isDriverView
                  ? driverVehicle?.isDirectlyAffected
                    ? "bg-red/20 text-red border border-red/30"
                    : "bg-green-tint text-green-deep border border-green/30"
                  : hasIncident
                    ? "bg-amber/20 text-amber"
                    : "bg-green-tint text-green-deep"
              }`}
            >
              {isDriverView
                ? driverVehicle?.isDirectlyAffected
                  ? "Congestion on Your Route"
                  : "Your Route Clear"
                : hasIncident
                  ? `${incidentCount} Active Disruption${incidentCount > 1 ? "s" : ""}`
                  : "Roads Free-Flow"}
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
                <p className="text-[11px] text-ink-faint">
                  {isDriverView ? "Stay on current route & sequence" : "Maintain planned stop sequence"}
                </p>
              </div>
            </div>
            {effectiveRecommendation === "WAIT" && (
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
                {effectiveWaitTime.toFixed(1)} <span className="text-[11px] font-normal">min</span>
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
                {effectiveWaitDist.toFixed(1)} <span className="text-[11px] font-normal">km</span>
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
            {activeMode === "wait"
              ? isDriverView ? "Active Course: WAIT" : "Active Map Display: WAIT"
              : isDriverView ? "Keep WAIT Course" : "Display WAIT Route on Map"}
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
                <p className="text-[11px] text-ink-faint">
                  {isDriverView ? "Dynamic traffic bypass detour" : "Quantum PSO dynamic detour"}
                </p>
              </div>
            </div>
            {effectiveRecommendation === "REROUTE" && (
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
                {effectiveRerouteTime.toFixed(1)} <span className="text-[11px] font-normal">min</span>
              </p>
              {effectiveTimeSaved > 0 ? (
                <p className="font-mono text-[10px] text-green-deep font-bold">
                  -{effectiveTimeSaved.toFixed(1)} min faster
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
                {effectiveRerouteDist.toFixed(1)} <span className="text-[11px] font-normal">km</span>
              </p>
              {effectiveDetourKm > 0 ? (
                <p className="font-mono text-[10px] text-ink-faint font-semibold">
                  +{effectiveDetourKm.toFixed(1)} km detour
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

      {/* Vehicle Breakdown: Isolated single-vehicle card for Driver, full table for Manager/Admin */}
      {isDriverView && driverVehicle ? (
        <section className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)] min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-display text-[14px] font-bold text-ink">
                Your Assigned Vehicle (Truck #{driverVehicle.label})
              </h3>
              <p className="text-[11px] text-ink-faint">
                Individual road analysis strictly for your route · Other trucks omitted
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                driverVehicle.recommendation === "REROUTE"
                  ? "bg-green text-white"
                  : "bg-amber/20 text-amber"
              }`}
            >
              Recommended: {driverVehicle.recommendation}
            </span>
          </div>

          <div className="rounded-xl border border-line/70 bg-paper/60 p-3 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: driverVehicle.color }} />
                <span className="font-display text-[13px] font-bold text-ink">
                  Vehicle #{driverVehicle.label} · {driverName || "Rajesh Kumar"}
                </span>
              </div>
              {driverVehicle.isDirectlyAffected ? (
                <span className="rounded bg-red/15 px-2 py-0.5 text-[10px] font-bold text-red border border-red/30">
                  In Jam Zone
                </span>
              ) : (
                <span className="rounded bg-green/15 px-2 py-0.5 text-[10px] font-bold text-green-deep border border-green/30">
                  Clear Road Ahead
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="rounded-lg bg-card p-2.5 border border-line/60">
                <p className="text-[10px] text-ink-faint font-medium">WAIT Travel Time</p>
                <p className="font-mono text-[15px] font-bold text-amber mt-0.5">{driverVehicle.waitTimeMin.toFixed(0)} min</p>
              </div>
              <div className="rounded-lg bg-card p-2.5 border border-line/60">
                <p className="text-[10px] text-ink-faint font-medium">REROUTE Time</p>
                <p className="font-mono text-[15px] font-bold text-green-deep mt-0.5">{driverVehicle.rerouteTimeMin.toFixed(0)} min</p>
              </div>
              <div className="rounded-lg bg-card p-2.5 border border-line/60">
                <p className="text-[10px] text-ink-faint font-medium">Detour Distance</p>
                <p className="font-mono text-[15px] font-bold text-ink mt-0.5">
                  {driverVehicle.detourDistKm > 0.1 ? `+${driverVehicle.detourDistKm.toFixed(1)} km` : "0 km"}
                </p>
              </div>
              <div className="rounded-lg bg-card p-2.5 border border-line/60">
                <p className="text-[10px] text-ink-faint font-medium">Time Difference</p>
                <p className="font-mono text-[15px] font-bold text-green-deep mt-0.5">
                  {driverVehicle.timeSavingsMin > 0 ? `-${driverVehicle.timeSavingsMin.toFixed(1)} min` : "0 min"}
                </p>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-ink-soft">
              <span>Showing: <strong className="text-ink">Vehicle #{driverVehicle.label} Only</strong></span>
              <span className="font-mono text-[10px] text-ink-faint">Engine: QPSO-Dynamic</span>
            </div>
          </div>
        </section>
      ) : (
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
      )}
    </div>
  );
}
