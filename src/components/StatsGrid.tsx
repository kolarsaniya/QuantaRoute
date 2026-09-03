import { Clock, Gauge, Route as RouteIcon, Weight } from "lucide-react";
import type { Solution } from "../lib/types";
import { capacityFor, TOTAL_DEMAND } from "../lib/network";

interface Props {
  solution: Solution | null;
  fleet: number;
  avgCongestion: number;
  incidentCount: number;
}

export function StatsGrid({ solution, fleet, avgCongestion, incidentCount }: Props) {
  const cap = capacityFor(fleet);
  const usedLoad = solution ? solution.vehicles.reduce((s, v) => s + v.load, 0) : 0;
  const utilization = solution ? Math.round((usedLoad / (fleet * cap)) * 100) : 0;

  const tiles = [
    {
      icon: Clock,
      label: "Total travel time",
      value: solution ? `${solution.totalTimeMin.toFixed(0)}` : "—",
      unit: "min",
      accent: "text-blue",
      chip: "bg-blue",
      sub: solution ? `cost ${solution.cost.toFixed(1)}` : "awaiting solve",
    },
    {
      icon: RouteIcon,
      label: "Total distance",
      value: solution ? `${solution.totalDistanceKm.toFixed(1)}` : "—",
      unit: "km",
      accent: "text-green",
      chip: "bg-green",
      sub: "road-network est.",
    },
    {
      icon: Weight,
      label: "Fleet utilization",
      value: solution ? `${utilization}` : "—",
      unit: "%",
      accent: "text-violet",
      chip: "bg-violet",
      sub: `${usedLoad}/${TOTAL_DEMAND} units`,
    },
    {
      icon: Gauge,
      label: "Network congestion",
      value: `×${avgCongestion.toFixed(2)}`,
      unit: "",
      accent: avgCongestion > 1.35 ? "text-red" : "text-orange",
      chip: avgCongestion > 1.35 ? "bg-red" : "bg-orange",
      sub: `${incidentCount} incident${incidentCount === 1 ? "" : "s"}`,
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className="anim-up rounded-xl border border-line bg-card p-3 shadow-[0_2px_0_rgba(14,17,22,0.06)]"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-1.5">
            <span className={`flex h-5 w-5 items-center justify-center rounded-md ${t.chip} text-white`}>
              <t.icon size={12} />
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wide text-ink-faint">{t.label}</p>
          </div>
          <p key={t.value} className="anim-pop mt-2 font-mono text-2xl font-bold leading-none text-ink">
            {t.value}
            {t.unit && <span className={`ml-1 text-xs font-medium ${t.accent}`}>{t.unit}</span>}
          </p>
          <p className="mt-1 font-mono text-[10px] text-ink-faint">{t.sub}</p>
        </div>
      ))}
    </section>
  );
}
