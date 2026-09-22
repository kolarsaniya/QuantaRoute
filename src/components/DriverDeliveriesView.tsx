import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Package,
  Phone,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";
import type { DriverProfile } from "../lib/driverTypes";
import type { Stop, VehicleRoute } from "../lib/types";

interface Props {
  driver: DriverProfile;
  stops: Stop[];
  route?: VehicleRoute;
  onToast: (msg: string, tone?: "traffic" | "accident" | "info") => void;
}

export function DriverDeliveriesView({ driver, stops, route, onToast }: Props) {
  // Assigned stop IDs for this driver's vehicle (default to first vehicle's stops or fallback)
  const assignedStopIds = route?.stopIds ?? [1, 2, 6, 8];
  const assignedStops = assignedStopIds
    .map((id) => stops.find((s) => s.id === id))
    .filter((s): s is Stop => Boolean(s));

  const [completedIds, setCompletedIds] = useState<number[]>([1]);
  const [search, setSearch] = useState("");

  const toggleDelivered = (id: number, name: string) => {
    if (completedIds.includes(id)) {
      setCompletedIds((prev) => prev.filter((sId) => sId !== id));
      onToast(`Stop #${id} marked as pending`, "info");
    } else {
      setCompletedIds((prev) => [...prev, id]);
      onToast(`Delivery confirmed for ${name}! Proof of delivery sent to Admin`, "info");
    }
  };

  const filteredStops = assignedStops.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  const completedCount = completedIds.filter((id) => assignedStopIds.includes(id)).length;
  const progressPct = assignedStops.length > 0 ? Math.round((completedCount / assignedStops.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header & Progress Card */}
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink sm:text-xl">
                My Delivery Stops
              </h2>
              <span className="rounded-full bg-green/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-green-deep border border-green/30">
                Route #{driver.vehicleNumber}
              </span>
            </div>
            <p className="text-[12px] text-ink-soft mt-0.5">
              Assigned to {driver.name} · {driver.vehicleModel} ({driver.plate})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-mono text-base font-bold text-ink sm:text-lg">
                {completedCount} / {assignedStops.length}
              </span>
              <p className="text-[10px] font-bold uppercase text-ink-faint">Completed</p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-green/15 text-green-deep font-mono font-bold text-sm">
              {progressPct}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-paper border border-line">
          <div
            className="h-full bg-green transition-all duration-500 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned stops..."
              className="w-full rounded-xl border border-line bg-paper py-2 pl-8 pr-3 text-[12px] text-ink placeholder:text-ink-faint focus:border-green focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stops Sequence Checklist */}
      <div className="space-y-3">
        {filteredStops.map((stop, seq) => {
          const isDelivered = completedIds.includes(stop.id);
          const isNext = !isDelivered && completedIds.length === seq;
          const etaTime = `${String(9 + seq).padStart(2, "0")}:${(15 + seq * 14) % 60 < 10 ? `0${(15 + seq * 14) % 60}` : (15 + seq * 14) % 60} AM`;

          return (
            <div
              key={stop.id}
              className={`rounded-2xl border bg-card p-4 transition-all shadow-[0_2px_0_rgba(11,15,14,0.05)] ${
                isDelivered
                  ? "border-line bg-card/60 opacity-80"
                  : isNext
                    ? "border-green/70 ring-1 ring-green/50"
                    : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-sm shrink-0 ${
                      isDelivered
                        ? "bg-green text-white"
                        : isNext
                          ? "bg-ink text-white"
                          : "bg-paper text-ink-soft border border-line"
                    }`}
                  >
                    {isDelivered ? <CheckCircle2 size={20} /> : `#${seq + 1}`}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-ink">
                        {stop.name}
                      </h3>
                      {isNext && (
                        <span className="rounded bg-green/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase text-green-deep">
                          Next Stop
                        </span>
                      )}
                      {isDelivered && (
                        <span className="rounded bg-green/10 px-2 py-0.5 font-mono text-[9px] font-bold text-green-deep">
                          Delivered
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-ink-soft mt-0.5 flex items-center gap-1.5">
                      <MapPin size={12} className="text-green" />
                      GPS: {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)} · Bengaluru Urban
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-soft">
                      <span className="flex items-center gap-1">
                        <Package size={13} className="text-ink-faint" />
                        <strong>{stop.demand}</strong> units cargo
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-ink-faint" />
                        ETA: <strong>{etaTime}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${driver.phone}`}
                    className="flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-2 text-[11px] font-bold text-ink hover:bg-card hover:border-ink transition"
                  >
                    <Phone size={12} className="text-green" /> Call
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-line bg-paper px-3 py-2 text-[11px] font-bold text-ink hover:bg-card hover:border-ink transition"
                  >
                    <Navigation size={12} className="text-blue-500" /> Map
                    <ExternalLink size={10} className="opacity-60" />
                  </a>

                  <button
                    onClick={() => toggleDelivered(stop.id, stop.name)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-bold transition shadow-sm ${
                      isDelivered
                        ? "border border-line bg-paper text-ink-faint hover:bg-card hover:text-ink"
                        : "bg-green text-white shadow-[0_2px_0_#0c7a37] hover:bg-green-deep"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    {isDelivered ? "Mark Pending" : "Mark Delivered"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
