import { useState, useMemo } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flame,
  Fuel,
  MessageSquare,
  Package,
  Phone,
  Send,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { MapView } from "./MapView";
import type { Incident, Solution, Stop, VehicleRoute, WaitVsRerouteComparison } from "../lib/types";
import { DRIVER_ROSTER } from "../lib/driverTypes";

interface Props {
  stops: Stop[];
  stopMarkers: Record<number, { color: string; label: string }>;
  incidents: Incident[];
  routes: VehicleRoute[];
  altRoutes?: VehicleRoute[];
  solution: Solution | null;
  waitVsReroute: WaitVsRerouteComparison | null;
  onNavigateTab: (tab: "fleet-vehicles" | "fleet-manifest" | "compare") => void;
  onAddTraffic: () => void;
  onAddAccident: () => void;
  onClearIncidents: () => void;
  onToast?: (msg: string, tone: "traffic" | "accident" | "info") => void;
  onDraftClick?: () => void;
}

export function FleetManagerDashboard({
  stops,
  stopMarkers,
  incidents,
  routes,
  altRoutes,
  solution,
  waitVsReroute,
  onNavigateTab,
  onAddTraffic,
  onAddAccident,
  onClearIncidents,
  onToast,
  onDraftClick,
}: Props) {
  // Fleet Manager map route view: defaults to "all" so manager sees paths for ALL trucks
  const [managerRouteId, setManagerRouteId] = useState<number | "all">("all");

  const isolatedRoutes = useMemo(() => {
    if (managerRouteId === "all") return routes;
    return routes.filter((r) => r.vehicleId === managerRouteId);
  }, [routes, managerRouteId]);

  const isolatedStopIds = useMemo(() => {
    return new Set(isolatedRoutes.flatMap((r: VehicleRoute) => r.stopIds));
  }, [isolatedRoutes]);

  const isolatedStopMarkers = useMemo(() => {
    if (managerRouteId === "all") return stopMarkers;
    const res: Record<number, { color: string; label: string }> = {};
    Object.entries(stopMarkers).forEach(([k, v]) => {
      const id = Number(k);
      if (isolatedStopIds.has(id)) {
        res[id] = v;
      }
    });
    return res;
  }, [stopMarkers, isolatedStopIds, managerRouteId]);

  const [selectedTruck, setSelectedTruck] = useState<number | null>(null);

  const totalCapacityUnits = routes.length * 20; // baseline 20u per vehicle
  const totalLoadedUnits = stops.reduce((sum, s) => sum + s.demand, 0);
  const utilizationPercent = Math.min(100, Math.round((totalLoadedUnits / Math.max(1, totalCapacityUnits)) * 100));

  const totalDistance = solution?.totalDistanceKm.toFixed(1) ?? "48.2";
  const totalTime = solution?.totalTimeMin.toFixed(0) ?? "145";

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Fleet Operations Headline Bar */}
      <div className="anim-up flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-green/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-green-bright">
              Operations Active
            </span>
            <span className="font-mono text-[11px] text-ink-faint">Territory: Bangalore Urban</span>
          </div>
          <h2 className="mt-1 font-display text-lg font-bold tracking-tight text-ink sm:text-2xl">
            Fleet Dispatch Console
          </h2>
          <p className="text-[12px] text-ink-soft sm:text-[13px]">
            Real-time telemetry, driver status, delivery progress, and incident routing control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onDraftClick && (
            <button
              onClick={onDraftClick}
              className="flex items-center gap-1.5 rounded-xl border border-green/40 bg-green/10 px-3.5 py-2 text-[12px] font-bold text-green-deep transition hover:bg-green/20"
            >
              <Send size={14} /> Send Broadcast
            </button>
          )}
          <button
            onClick={() => onNavigateTab("fleet-vehicles")}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-[12px] font-bold text-ink transition hover:border-green hover:bg-card"
          >
            <Truck size={14} /> Vehicles List
          </button>
          <button
            onClick={() => onNavigateTab("fleet-manifest")}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-[12px] font-bold text-ink transition hover:border-green hover:bg-card"
          >
            <ClipboardList size={14} /> Delivery Manifest
          </button>
          <button
            onClick={() => onNavigateTab("compare")}
            className="flex items-center gap-1.5 rounded-xl bg-green px-4 py-2 text-[12px] font-bold text-white shadow-[0_3px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5"
          >
            <CheckCircle2 size={14} /> Wait vs Reroute
          </button>
        </div>
      </div>

      {/* Operational KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft">
            <span>Active Trucks</span>
            <Truck size={15} className="text-green" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {routes.length} / 5
          </p>
          <p className="mt-2 text-[10px] font-mono text-green-deep font-semibold">
            ● All drivers on-duty
          </p>
        </div>

        <div className="rounded-xl border border-line bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft">
            <span>Fleet Capacity</span>
            <Package size={15} className="text-amber" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {utilizationPercent}%
          </p>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-paper overflow-hidden border border-line">
            <div
              className="h-full bg-amber rounded-full transition-all"
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft">
            <span>Total Drive Time</span>
            <Clock size={15} className="text-ink" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            {totalTime} min
          </p>
          <p className="mt-2 text-[10px] font-mono text-ink-faint">
            {totalDistance} km total mileage
          </p>
        </div>

        <div className="rounded-xl border border-line bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft">
            <span>On-Time Estimate</span>
            <ShieldCheck size={15} className="text-green" />
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-green-deep">
            {incidents.length === 0 ? "98.8%" : "94.2%"}
          </p>
          <p className="mt-2 text-[10px] font-mono text-ink-faint">
            {incidents.length} disruptions handled
          </p>
        </div>
      </div>

      {/* Main Grid: Operations Map + Live Fleet List */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Column: Map & Active Situation */}
        <div className="space-y-4 min-w-0">
          <div className="relative isolate z-0 h-[50dvh] min-h-[340px] overflow-hidden rounded-xl border border-line shadow-[0_2px_0_rgba(11,15,14,0.05)] lg:h-[500px]">
            <MapView
              stops={stops}
              stopMarkers={isolatedStopMarkers}
              incidents={incidents}
              routes={isolatedRoutes}
              altRoutes={altRoutes}
              addMode={false}
              onAddStop={() => {}}
            />

            {/* Map Overlay Badge */}
            <div className="absolute top-3 left-3 z-[500] flex items-center gap-2 rounded-lg border border-line/80 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
              <span className="flex h-2 w-2 rounded-full bg-green qr-blink" />
              <span className="font-display text-[11px] font-bold text-ink">
                Fleet Manager Map
              </span>
              <span className="font-mono text-[10px] text-ink-faint">
                ({isolatedRoutes.length} of {routes.length} truck paths · {managerRouteId === "all" ? "All Paths Visible" : `Truck #${Number(managerRouteId) + 1} Selected`})
              </span>
            </div>

            {/* Route Scoping Selector: All Trucks default, with single truck filters */}
            <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap items-center gap-1.5 rounded-xl border border-line/80 bg-white/95 p-1.5 shadow-md backdrop-blur-sm">
              <span className="px-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                View Paths:
              </span>
              <button
                onClick={() => setManagerRouteId("all")}
                className={`rounded-lg px-2.5 py-1 font-mono text-[10px] font-bold transition ${
                  managerRouteId === "all"
                    ? "bg-green text-white shadow-sm"
                    : "text-ink-soft hover:bg-paper"
                }`}
              >
                All Trucks ({routes.length})
              </button>
              {routes.map((r) => (
                <button
                  key={r.vehicleId}
                  onClick={() => setManagerRouteId(r.vehicleId)}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1 font-mono text-[10px] font-bold transition ${
                    managerRouteId === r.vehicleId
                      ? "bg-ink text-white shadow-sm"
                      : "text-ink-soft hover:bg-paper"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />
                  Truck #{r.vehicleId + 1}
                </button>
              ))}
            </div>

            {incidents.length > 0 && (
              <div className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 rounded-lg border border-amber/40 bg-amber/90 px-3 py-1.5 text-ink shadow-md backdrop-blur-sm">
                <AlertTriangle size={13} className="text-ink" />
                <span className="font-display text-[11px] font-bold">
                  {incidents.length} Road Disruption{incidents.length > 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => onNavigateTab("compare")}
                  className="ml-1 text-[11px] underline font-bold hover:text-black"
                >
                  Review Detour
                </button>
              </div>
            )}
          </div>

          {/* Quick Simulation Bar for Fleet Manager */}
          <div className="rounded-xl border border-line bg-card p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-amber" />
              <span className="text-[12px] font-semibold text-ink">Simulate Incident:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={onAddTraffic}
                className="flex items-center gap-1 rounded-lg border border-amber/40 bg-amber/10 px-2.5 py-1 text-[11px] font-bold text-amber hover:bg-amber/20 transition"
              >
                + Traffic Jam
              </button>
              <button
                onClick={onAddAccident}
                className="flex items-center gap-1 rounded-lg border border-red/40 bg-red/10 px-2.5 py-1 text-[11px] font-bold text-red hover:bg-red/20 transition"
              >
                + Road Accident
              </button>
              {incidents.length > 0 && (
                <button
                  onClick={onClearIncidents}
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:text-red transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Fleet Drivers & Truck Telemetry */}
        <div className="space-y-4 min-w-0">
          <div className="rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div>
                <h3 className="font-display text-sm font-bold text-ink flex items-center gap-1.5">
                  <Users size={16} className="text-green" /> Driver Telemetry & Trucks
                </h3>
                <p className="text-[11px] text-ink-faint">
                  Active drivers assigned to current dispatch tours
                </p>
              </div>
              <span className="font-mono text-[10px] font-bold text-green-deep bg-green-tint px-2 py-0.5 rounded-full">
                {routes.length} En Route
              </span>
            </div>

            <div className="mt-3 space-y-3 max-h-[580px] overflow-y-auto pr-0.5 dark-scroll">
              {routes.map((v, i) => {
                const driver = DRIVER_ROSTER[v.vehicleId] ?? DRIVER_ROSTER[i % 5];
                const isSelected = selectedTruck === v.vehicleId;
                const isAffected = waitVsReroute?.vehicles.find((x) => x.vehicleId === v.vehicleId)?.isDirectlyAffected;

                return (
                  <div
                    key={v.vehicleId}
                    onClick={() => setSelectedTruck(isSelected ? null : v.vehicleId)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-green bg-green-tint/30 ring-1 ring-green shadow-sm"
                        : "border-line bg-paper/50 hover:bg-paper hover:border-ink/20"
                    }`}
                  >
                    {/* Header: Truck tag, color dot, driver */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: v.color }}
                        />
                        <p className="font-display text-[13px] font-bold text-ink truncate">
                          Truck {v.label} · {driver.name}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                          isAffected
                            ? "bg-red/10 text-red"
                            : "bg-green-tint text-green-deep"
                        }`}
                      >
                        {isAffected ? "Congestion" : "On Route"}
                      </span>
                    </div>

                    {/* Vehicle details */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink-soft">
                      <span>{driver.vehicleModel}</span>
                      <span className="font-mono text-[10px] text-ink-faint">{driver.plate}</span>
                    </div>

                    {/* Telemetry row */}
                    <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-line/60 pt-2 text-[10px] font-mono">
                      <div>
                        <span className="text-ink-faint block">Stops</span>
                        <span className="font-bold text-ink">{v.stopIds.length} drops</span>
                      </div>
                      <div>
                        <span className="text-ink-faint block">Est. Time</span>
                        <span className="font-bold text-ink">{v.timeMin.toFixed(0)} min</span>
                      </div>
                      <div>
                        <span className="text-ink-faint block flex items-center gap-1">
                          {driver.fuelType === "EV" ? (
                            <BatteryCharging size={10} className="text-green" />
                          ) : (
                            <Fuel size={10} className="text-amber" />
                          )}
                          Power
                        </span>
                        <span className="font-bold text-ink">{driver.fuelLevel}%</span>
                      </div>
                    </div>

                    {/* Quick driver action buttons */}
                    <div className="mt-3 flex items-center gap-2 border-t border-line/60 pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToast?.(`Calling ${driver.name} (${driver.phone})...`, "info");
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-white py-1.5 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition"
                      >
                        <Phone size={12} /> Call
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToast?.(`Opening WhatsApp dispatch chat with ${driver.name}...`, "info");
                        }}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-white py-1.5 text-[11px] font-semibold text-ink hover:bg-ink hover:text-white transition"
                      >
                        <MessageSquare size={12} /> Message
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
