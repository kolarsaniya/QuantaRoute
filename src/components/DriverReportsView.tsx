import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Car,
  Check,
  CheckCircle2,
  Clock,
  MapPin,
  MessageSquare,
  Radio,
  Send,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import type {
  DriverIncidentReport,
  DriverIncidentType,
  DriverProfile,
} from "../lib/driverTypes";
import type { Stop } from "../lib/types";

interface Props {
  driver: DriverProfile;
  stops: Stop[];
  reports: DriverIncidentReport[];
  onSubmitReport: (report: DriverIncidentReport) => void;
  onToast: (msg: string, tone?: "traffic" | "accident" | "info") => void;
}

const CATEGORIES: {
  type: DriverIncidentType;
  title: string;
  desc: string;
  icon: typeof AlertTriangle;
  color: string;
  severity: "low" | "medium" | "high" | "critical";
}[] = [
  {
    type: "traffic",
    title: "Heavy Traffic Congestion",
    desc: "Gridlock or bottleneck stalling route (auto-triggers Quantum reroute)",
    icon: Car,
    color: "text-amber border-amber/40 bg-amber/10",
    severity: "medium",
  },
  {
    type: "breakdown",
    title: "Vehicle Breakdown / Flat Tire",
    desc: "Engine failure, flat tire, or mechanical issue requiring roadside support",
    icon: Wrench,
    color: "text-red border-red/40 bg-red/10",
    severity: "high",
  },
  {
    type: "roadblock",
    title: "Road Blocked / Flooding",
    desc: "Construction, waterlogging, or police barricade blocking street access",
    icon: AlertOctagon,
    color: "text-orange-500 border-orange-500/40 bg-orange-500/10",
    severity: "high",
  },
  {
    type: "customer_unavailable",
    title: "Customer Not Available",
    desc: "Door locked, recipient phone unanswered, or wrong delivery address",
    icon: XCircle,
    color: "text-blue-500 border-blue-500/40 bg-blue-500/10",
    severity: "low",
  },
  {
    type: "sos",
    title: "Emergency / SOS Dispatch",
    desc: "Accident, security threat, or medical emergency. Immediate high-priority dispatch",
    icon: ShieldAlert,
    color: "text-red border-red bg-red/15 animate-pulse",
    severity: "critical",
  },
];

export function DriverReportsView({
  driver,
  stops,
  reports,
  onSubmitReport,
  onToast,
}: Props) {
  const [selectedType, setSelectedType] = useState<DriverIncidentType>("traffic");
  const [selectedStopId, setSelectedStopId] = useState<number>(stops[0]?.id ?? 1);
  const [description, setDescription] = useState("");
  const [estDelayMin, setEstDelayMin] = useState("15");

  const selectedCat = CATEGORIES.find((c) => c.type === selectedType) ?? CATEGORIES[0];
  const targetStop = stops.find((s) => s.id === selectedStopId) ?? stops[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newReport: DriverIncidentReport = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      driverId: driver.id,
      driverName: driver.name,
      vehiclePlate: driver.plate,
      type: selectedType,
      title: selectedCat.title,
      description: description.trim() || `Reported ${selectedCat.title} near ${targetStop.name}. Estimated delay: ${estDelayMin} mins.`,
      locationName: targetStop.name,
      lat: targetStop.lat,
      lng: targetStop.lng,
      severity: selectedCat.severity,
      timestamp: "Just now",
      status: "reported",
    };

    onSubmitReport(newReport);
    setDescription("");
    onToast(
      `Field report (${selectedCat.title}) submitted to Admin & Fleet Manager!`,
      selectedType === "breakdown" || selectedType === "sos" ? "accident" : "traffic",
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red/15 text-red font-bold">
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                  On-Road Incident & Issue Reporting
                </h2>
                <span className="rounded-full bg-red/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-red border border-red/30">
                  Live Dispatch Feed
                </span>
              </div>
              <p className="text-[12px] text-ink-soft mt-0.5">
                Driver {driver.name} · Vehicle #{driver.vehicleNumber} ({driver.plate})
              </p>
            </div>
          </div>
          <span className="font-mono text-[11px] text-ink-faint">
            Syncs with Admin & Fleet Operations
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Incident Form (Left 7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-line bg-card p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
          <h3 className="font-display text-base font-bold text-ink mb-1">
            New Incident Report
          </h3>
          <p className="text-[12px] text-ink-soft mb-4">
            Select the issue type to alert fleet managers and automatically trigger route rerouting.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selectors */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-2">
                Select Incident Category *
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {CATEGORIES.map((cat) => {
                  const active = selectedType === cat.type;
                  const Icon = cat.icon;
                  return (
                    <button
                      type="button"
                      key={cat.type}
                      onClick={() => setSelectedType(cat.type)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? `${cat.color} ring-2 ring-ink/20 font-bold`
                          : "border-line bg-paper/60 hover:bg-paper text-ink-soft"
                      }`}
                    >
                      <Icon size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-display text-[13px] font-bold leading-snug">
                          {cat.title}
                        </p>
                        <p className="text-[10.5px] leading-tight opacity-80 mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Location & Estimated Delay */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Nearest Stop / Location *
                </label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <select
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(Number(e.target.value))}
                    className="w-full rounded-xl border border-line bg-paper py-2.5 pl-8 pr-3 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                  >
                    {stops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Stop #{s.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                  Estimated Delay (Minutes)
                </label>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <select
                    value={estDelayMin}
                    onChange={(e) => setEstDelayMin(e.target.value)}
                    className="w-full rounded-xl border border-line bg-paper py-2.5 pl-8 pr-3 text-[12px] font-semibold text-ink focus:border-green focus:outline-none"
                  >
                    <option value="10">10 Minutes</option>
                    <option value="15">15 Minutes</option>
                    <option value="25">25 Minutes</option>
                    <option value="45">45+ Minutes (Severe)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description / Driver Notes */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1">
                Additional Details / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Tree fallen on left lane, traffic diverting towards Cubbon Rd..."
                rows={3}
                className="w-full rounded-xl border border-line bg-paper p-3 text-[12px] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red py-3 text-[13px] font-bold text-white shadow-[0_3px_0_#b91c1c] hover:bg-red/90 transition active:translate-y-0.5"
            >
              <Send size={16} /> Submit Report to Admin & Dispatch
            </button>
          </form>
        </div>

        {/* Previous Reports Stream (Right 5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-line bg-card p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
          <div className="flex items-center justify-between mb-3 border-b border-line/60 pb-3">
            <h3 className="font-display text-base font-bold text-ink">
              Recent Field Logs ({reports.length})
            </h3>
            <span className="font-mono text-[10px] text-ink-faint">Live Status</span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <div className="py-12 text-center text-ink-faint text-[13px]">
                No field incidents reported today. Drive safe!
              </div>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-line bg-paper/70 p-3.5 space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[13px] font-bold text-ink">
                      {r.title}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                        r.severity === "critical"
                          ? "bg-red text-white"
                          : r.severity === "high"
                            ? "bg-red/15 text-red"
                            : "bg-amber/15 text-amber"
                      }`}
                    >
                      {r.severity}
                    </span>
                  </div>

                  <p className="text-[12px] text-ink-soft">{r.description}</p>

                  <div className="flex items-center justify-between pt-1 border-t border-line/50 font-mono text-[10px] text-ink-faint">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-green" /> {r.locationName}
                    </span>
                    <span>{r.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
