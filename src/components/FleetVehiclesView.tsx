import { useState } from "react";
import {
  BatteryCharging,
  Fuel,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Star,
  Truck,
  UserCog,
} from "lucide-react";
import { DRIVER_ROSTER, type DriverProfile } from "../lib/driverTypes";
import type { Stop, VehicleRoute } from "../lib/types";
import { EditDriverModal } from "./EditDriverModal";

interface Props {
  routes: VehicleRoute[];
  stops: Stop[];
  onSelectVehicle?: (id: number) => void;
  onToast?: (msg: string, tone: "traffic" | "accident" | "info") => void;
  drivers?: DriverProfile[];
  onUpdateDriver?: (d: DriverProfile) => void;
  onAddNewFleetClick?: () => void;
}

export function FleetVehiclesView({
  routes,
  stops,
  onSelectVehicle: _onSelectVehicle,
  onToast,
  drivers,
  onUpdateDriver,
  onAddNewFleetClick,
}: Props) {
  const [filter, setFilter] = useState<"all" | "active" | "ev" | "diesel">("all");
  const [search, setSearch] = useState("");
  const [editingDriver, setEditingDriver] = useState<DriverProfile | null>(null);

  const totalVehicleCount = Math.max(5, drivers?.length ?? 5);

  const allVehicles = Array.from({ length: totalVehicleCount }).map((_, i) => {
    const route = routes.find((r) => r.vehicleId === i);
    const fallbackDriver = DRIVER_ROSTER[i] || {
      id: i,
      name: `Driver ${i + 1}`,
      phone: "+91 98450 00000",
      avatar: `D${i + 1}`,
      vehicleModel: "Commercial Cargo Truck",
      plate: `KA-01-TR-000${i + 1}`,
      fuelType: "EV",
      fuelLevel: 80,
      rating: 4.8,
    };
    const liveDriver = drivers?.find((d) => d.vehicleNumber === i + 1);
    const driver = liveDriver
      ? {
          name: liveDriver.name,
          phone: liveDriver.phone,
          plate: liveDriver.plate,
          vehicleModel: liveDriver.vehicleModel,
          fuelType: liveDriver.fuelType,
          fuelLevel: liveDriver.batteryOrFuelLevel,
          rating: liveDriver.rating,
          avatar: liveDriver.avatarInitials,
        }
      : fallbackDriver;
    const isAssigned = Boolean(route);
    return {
      id: i,
      label: String(i + 1),
      route,
      driver,
      rawDriver: liveDriver,
      status: isAssigned ? ("En Route" as const) : ("Standby at Depot" as const),
      odometer: 18200 + i * 4350,
      serviceDueDays: 14 + i * 18,
    };
  });

  const filtered = allVehicles.filter((v) => {
    if (filter === "active" && v.status !== "En Route") return false;
    if (filter === "ev" && v.driver.fuelType !== "EV") return false;
    if (filter === "diesel" && v.driver.fuelType !== "Diesel") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.driver.name.toLowerCase().includes(q) ||
        v.driver.vehicleModel.toLowerCase().includes(q) ||
        v.driver.plate.toLowerCase().includes(q) ||
        `truck ${v.label}`.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Header bar */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green text-white text-[12px] font-bold">
                <Truck size={15} />
              </span>
              <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                Vehicles & Assigned Drivers
              </h2>
            </div>
            <p className="mt-1 text-[12px] text-ink-soft">
              Manage truck telemetry, driver assignments, vehicle battery levels, and route readiness across your 5-vehicle fleet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-[11px] font-bold text-ink">
              {routes.length} Active On Route
            </span>
            <span className="rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-[11px] font-bold text-ink-faint">
              {totalVehicleCount - routes.length} Standby
            </span>
            {onAddNewFleetClick && (
              <button
                onClick={onAddNewFleetClick}
                className="flex items-center gap-1.5 rounded-xl bg-green px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_3px_0_#0c7a37] hover:bg-green-deep active:translate-y-0.5 transition"
              >
                <Plus size={15} /> Add New Fleet & Driver
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: "all", label: "All Vehicles (5)" },
                { id: "active", label: `Active Dispatched (${routes.length})` },
                { id: "ev", label: "Electric Fleet (3)" },
                { id: "diesel", label: "Diesel Cargo (2)" },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                  filter === btn.id
                    ? "bg-green text-white shadow-sm"
                    : "border border-line bg-paper text-ink-soft hover:border-ink hover:text-ink"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search driver, truck, plate..."
              className="w-full rounded-lg border border-line bg-paper py-1.5 pl-8 pr-3 text-[12px] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const { id, label, route, driver, status } = item;
          const isEnRoute = status === "En Route";
          const stopsCount = route?.stopIds.length ?? 0;
          const assignedStops = route
            ? route.stopIds
                .map((sId) => stops.find((s) => s.id === sId)?.name)
                .filter(Boolean)
                .join(", ")
            : "No active run";

          return (
            <div
              key={id}
              className={`rounded-2xl border bg-card p-4 transition-all shadow-[0_2px_0_rgba(11,15,14,0.05)] ${
                isEnRoute ? "border-green/40 hover:border-green" : "border-line opacity-85 hover:opacity-100"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-mono text-[13px] font-bold shadow-sm"
                    style={{ backgroundColor: route?.color ?? "#475569" }}
                  >
                    T{label}
                  </span>
                  <div>
                    <h3 className="font-display text-[15px] font-bold text-ink">
                      Truck {label}
                    </h3>
                    <p className="text-[11px] text-ink-soft">{driver.vehicleModel}</p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                    isEnRoute ? "bg-green text-white" : "bg-paper text-ink-faint border border-line"
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Driver info cardlet */}
              <div className="mt-3.5 rounded-xl border border-line/70 bg-paper/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white font-bold text-[10px]">
                      {driver.avatar}
                    </span>
                    <div>
                      <p className="font-display text-[12px] font-bold text-ink leading-none">
                        {driver.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-ink-faint">{driver.plate}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1 rounded bg-amber/15 px-1.5 py-0.5 text-[10px] font-bold text-amber">
                    <Star size={11} fill="currentColor" /> {driver.rating}
                  </span>
                </div>
              </div>

              {/* Specs & Metrics Grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border border-line/60 bg-paper/40 p-2">
                  <span className="text-[10px] font-semibold text-ink-faint block">Energy / Fuel</span>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-mono font-bold text-ink">
                      {driver.fuelType === "EV" ? (
                        <BatteryCharging size={13} className="text-green" />
                      ) : (
                        <Fuel size={13} className="text-amber" />
                      )}
                      {driver.fuelLevel}%
                    </span>
                    <span className="text-[9px] font-mono text-ink-faint">{driver.fuelType}</span>
                  </div>
                </div>

                <div className="rounded-lg border border-line/60 bg-paper/40 p-2">
                  <span className="text-[10px] font-semibold text-ink-faint block">Payload</span>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono font-bold text-ink">
                      {route ? `${route.load} / 20 u` : "0 / 20 u"}
                    </span>
                    <span className="text-[9px] font-mono text-ink-faint">
                      {route ? `${Math.round((route.load / 20) * 100)}%` : "Empty"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned route preview */}
              <div className="mt-3 rounded-lg border border-line/60 bg-paper/30 p-2.5 text-[11px]">
                <p className="flex items-center gap-1 font-semibold text-ink-soft text-[10.5px]">
                  <MapPin size={11} className="text-green" /> Assigned Route ({stopsCount} stops)
                </p>
                <p className="mt-1 font-mono text-[10px] text-ink-faint truncate">
                  {assignedStops}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-3.5 flex items-center gap-2 border-t border-line/60 pt-3">
                <button
                  onClick={() => onToast?.(`Calling Driver ${driver.name} at ${driver.phone}...`, "info")}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-paper py-2 text-[11px] font-bold text-ink hover:bg-ink hover:text-white transition"
                >
                  <Phone size={12} /> Call
                </button>
                <button
                  onClick={() => onToast?.(`Message dispatch alert sent to ${driver.name}`, "info")}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-paper py-2 text-[11px] font-bold text-ink hover:bg-ink hover:text-white transition"
                >
                  <MessageSquare size={12} /> Text
                </button>
                <button
                  onClick={() => {
                    const drv = item.rawDriver || drivers?.find((d) => d.vehicleNumber === id + 1);
                    if (drv) {
                      setEditingDriver(drv);
                    } else {
                      onToast?.("Driver profile selected for editing", "info");
                    }
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-line bg-paper py-2 text-[11px] font-bold text-ink hover:bg-green hover:text-white hover:border-green transition"
                  title="Admin: Edit Driver Personal & Vehicle Details"
                >
                  <UserCog size={12} /> Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editingDriver && (
        <EditDriverModal
          driver={editingDriver}
          onClose={() => setEditingDriver(null)}
          onSave={(updated) => {
            onUpdateDriver?.(updated);
            onToast?.(`Driver profile for ${updated.name} updated successfully!`, "info");
          }}
        />
      )}
    </div>
  );
}
