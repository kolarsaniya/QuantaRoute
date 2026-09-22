import { useState } from "react";
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Gauge,
  Plus,
  ShieldCheck,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";
import { DRIVER_ROSTER } from "./FleetManagerDashboard";

interface Props {
  onToast?: (msg: string, tone: "traffic" | "accident" | "info") => void;
}

export function FleetMaintenanceView({ onToast }: Props) {
  const [vehicles, setVehicles] = useState([
    {
      id: 0,
      label: "1",
      driver: DRIVER_ROSTER[0],
      odometer: 18450,
      tireHealth: "Good · 34 PSI",
      brakeWear: 18,
      batteryHealth: 98,
      status: "Operational",
      nextService: "In 2,550 km (14 days)",
    },
    {
      id: 1,
      label: "2",
      driver: DRIVER_ROSTER[1],
      odometer: 22800,
      tireHealth: "Attention · 29 PSI",
      brakeWear: 36,
      batteryHealth: 94,
      status: "Operational",
      nextService: "In 1,200 km (7 days)",
    },
    {
      id: 2,
      label: "3",
      driver: DRIVER_ROSTER[2],
      odometer: 14100,
      tireHealth: "Good · 35 PSI",
      brakeWear: 12,
      batteryHealth: 99,
      status: "Operational",
      nextService: "In 5,900 km (32 days)",
    },
    {
      id: 3,
      label: "4",
      driver: DRIVER_ROSTER[3],
      odometer: 29500,
      tireHealth: "Good · 33 PSI",
      brakeWear: 42,
      batteryHealth: 91,
      status: "Service Scheduled",
      nextService: "Tomorrow 09:00 AM",
    },
    {
      id: 4,
      label: "5",
      driver: DRIVER_ROSTER[4],
      odometer: 19800,
      tireHealth: "Good · 34 PSI",
      brakeWear: 22,
      batteryHealth: 96,
      status: "Operational",
      nextService: "In 3,200 km (18 days)",
    },
  ]);

  return (
    <div className="space-y-4 min-w-0 w-full max-w-full">
      {/* Header */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green text-white text-[12px] font-bold">
                <Wrench size={15} />
              </span>
              <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                Fleet Maintenance & Vehicle Health
              </h2>
            </div>
            <p className="mt-1 text-[12px] text-ink-soft">
              Track vehicle servicing, tire pressure, EV battery degradation, and safety compliance across all 5 delivery trucks.
            </p>
          </div>

          <button
            onClick={() => onToast?.("New service log entry created", "info")}
            className="flex items-center gap-1.5 rounded-lg bg-green px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_2px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5"
          >
            <Plus size={14} /> Schedule Service
          </button>
        </div>

        {/* Health summary cards */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-line/70 bg-paper/60 p-3">
            <span className="text-[10.5px] font-semibold text-ink-faint block">Overall Fleet Health</span>
            <p className="mt-1 font-display text-xl font-bold text-green-deep flex items-center gap-1.5">
              <ShieldCheck size={18} /> 96.2%
            </p>
          </div>

          <div className="rounded-xl border border-line/70 bg-paper/60 p-3">
            <span className="text-[10.5px] font-semibold text-ink-faint block">EV Charging Hub</span>
            <p className="mt-1 font-display text-xl font-bold text-ink flex items-center gap-1.5">
              <Zap size={18} className="text-green" /> 3 / 3 Active
            </p>
          </div>

          <div className="rounded-xl border border-line/70 bg-paper/60 p-3">
            <span className="text-[10.5px] font-semibold text-ink-faint block">Upcoming Service</span>
            <p className="mt-1 font-display text-xl font-bold text-amber flex items-center gap-1.5">
              <AlertTriangle size={18} /> 1 Scheduled
            </p>
          </div>

          <div className="rounded-xl border border-line/70 bg-paper/60 p-3">
            <span className="text-[10.5px] font-semibold text-ink-faint block">Avg. Odometer</span>
            <p className="mt-1 font-display text-xl font-bold text-ink flex items-center gap-1.5">
              <Gauge size={18} /> 20,930 km
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Maintenance Table */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <h3 className="font-display text-sm font-bold text-ink mb-3">
          5-Vehicle Diagnostic Log
        </h3>

        <div className="overflow-x-auto min-w-0 max-w-full">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line bg-paper font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                <th className="px-3 py-2.5">Truck</th>
                <th className="px-3 py-2.5">Model & Plate</th>
                <th className="px-3 py-2.5">Odometer</th>
                <th className="px-3 py-2.5">Tire Condition</th>
                <th className="px-3 py-2.5">Brake Pad Wear</th>
                <th className="px-3 py-2.5">Power Health</th>
                <th className="px-3 py-2.5">Next Service</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 font-mono text-[11px]">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-paper/50 transition">
                  <td className="px-3 py-3 font-bold text-ink">
                    Truck {v.label}
                  </td>
                  <td className="px-3 py-3 font-sans">
                    <p className="font-bold text-ink">{v.driver.vehicleModel}</p>
                    <p className="font-mono text-[10px] text-ink-faint">{v.driver.plate}</p>
                  </td>
                  <td className="px-3 py-3 text-ink">
                    {v.odometer.toLocaleString()} km
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        v.tireHealth.includes("Attention")
                          ? "bg-amber/15 text-amber"
                          : "bg-green-tint text-green-deep"
                      }`}
                    >
                      {v.tireHealth}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-ink">
                    {v.brakeWear}% wear
                  </td>
                  <td className="px-3 py-3 font-semibold text-green-deep flex items-center gap-1">
                    <BatteryCharging size={13} className="text-green" /> {v.batteryHealth}%
                  </td>
                  <td className="px-3 py-3 font-sans text-ink-soft">
                    {v.nextService}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => onToast?.(`Diagnostic report for Truck ${v.label} logged`, "info")}
                      className="rounded-lg border border-line bg-paper px-2.5 py-1 text-[11px] font-bold text-ink hover:border-ink hover:bg-ink hover:text-white transition"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
