import { History, LayoutDashboard, Map, Package, Settings, Waypoints } from "lucide-react";

export type View = "dashboard" | "deliveries" | "plan" | "tracking" | "history" | "settings";

const ITEMS: { id: View; label: string; icon: typeof Map }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "deliveries", label: "My Deliveries", icon: Package },
  { id: "plan", label: "Route Plan", icon: Map },
  { id: "tracking", label: "Live Tracking", icon: Waypoints },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

interface Props {
  view: View;
  setView: (v: View) => void;
}

export function Sidebar({ view, setView }: Props) {
  return (
    <aside className="hidden shrink-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-night-line lg:bg-night lg:px-3 lg:py-4">
      {ITEMS.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold transition lg:w-full ${
              active
                ? "bg-green text-white shadow-[0_3px_0_#0c7a37]"
                : "text-white/65 hover:bg-night-soft hover:text-white"
            }`}
          >
            <item.icon size={17} />
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* promo card */}
      <div className="hidden lg:mt-auto lg:block">
        <div className="relative overflow-hidden rounded-xl bg-green p-4">
          <p className="font-display text-[15px] font-bold leading-snug text-white">
            QuantaRoute finds the best route, saves time and fuel.
          </p>
          <p className="mt-1 font-mono text-[10px] text-white/70">QPSO · metaheuristic engine</p>
          <svg viewBox="0 0 220 84" className="mt-3 w-full">
            {/* animated route */}
            <path
              d="M8 66 C 46 66, 58 34, 98 34 S 168 62, 210 30"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="qr-road"
            />
            <circle cx="8" cy="66" r="4" fill="#fff" />
            <circle cx="98" cy="34" r="3" fill="#fff" opacity="0.85" />
            {/* destination node with orbit ring */}
            <circle cx="210" cy="30" r="9" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
            <circle cx="210" cy="30" r="5" fill="#0c1210" stroke="#fff" strokeWidth="2" />
            {/* delivery truck */}
            <g className="qr-truck">
              <ellipse cx="120" cy="60" rx="30" ry="3.5" fill="rgba(12,18,16,0.25)" />
              <rect x="96" y="28" width="36" height="22" rx="3" fill="#fff" />
              <rect x="101" y="33" width="10" height="8" rx="1.5" fill="#16a34a" opacity="0.35" />
              <rect x="115" y="33" width="10" height="8" rx="1.5" fill="#16a34a" opacity="0.35" />
              <path d="M132 33 h10 l8 8 v9 h-18 z" fill="#fff" />
              <path d="M134 36 h7 l5 5 h-12 z" fill="#0c1210" opacity="0.8" />
              <circle cx="106" cy="52" r="5.5" fill="#0c1210" />
              <circle cx="106" cy="52" r="2.2" fill="#fff" />
              <circle cx="140" cy="52" r="5.5" fill="#0c1210" />
              <circle cx="140" cy="52" r="2.2" fill="#fff" />
            </g>
          </svg>
        </div>
      </div>
    </aside>
  );
}
