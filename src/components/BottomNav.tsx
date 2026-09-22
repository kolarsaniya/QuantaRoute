import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Bot,
  ClipboardList,
  GitCompare,
  History,
  LayoutDashboard,
  LucideIcon,
  MoreHorizontal,
  Package,
  Settings,
  Truck,
  Waypoints,
  Wrench,
  X,
} from "lucide-react";
import type { View } from "./Sidebar";

const ADMIN_TABS: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "deliveries", label: "Stops", icon: Package },
  { id: "compare", label: "Wait/Reroute", icon: GitCompare },
  { id: "tracking", label: "Track", icon: Waypoints },
];

const FLEET_TABS: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "fleet-dashboard", label: "Fleet", icon: LayoutDashboard },
  { id: "fleet-vehicles", label: "Vehicles", icon: Truck },
  { id: "fleet-manifest", label: "Manifest", icon: ClipboardList },
  { id: "compare", label: "Wait/Reroute", icon: GitCompare },
];

const DRIVER_TABS: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "driver-assistant", label: "Assistant", icon: Bot },
  { id: "driver-deliveries", label: "Stops", icon: Package },
  { id: "driver-reports", label: "Report", icon: AlertTriangle },
  { id: "driver-notifications", label: "Alerts", icon: Bell },
];

export function BottomNav({
  view,
  setView,
  role = "admin",
  unreadNotificationsCount = 0,
}: {
  view: View;
  setView: (v: View) => void;
  role?: "admin" | "fleetmanager" | "fleetdriver";
  unreadNotificationsCount?: number;
}) {
  const [more, setMore] = useState(false);
  const tabs =
    role === "fleetdriver"
      ? DRIVER_TABS
      : role === "fleetmanager"
        ? FLEET_TABS
        : ADMIN_TABS;

  const moreItems: { id: View; label: string; icon: LucideIcon }[] =
    role === "fleetdriver"
      ? [
          { id: "compare", label: "Wait vs Reroute", icon: GitCompare },
          { id: "history", label: "Trip History", icon: History },
        ]
      : role === "fleetmanager"
        ? [
            { id: "fleet-maintenance", label: "Maintenance", icon: Wrench },
            { id: "history", label: "History", icon: History },
          ]
        : [
            { id: "admin-notifications", label: "Notifications", icon: Bell },
            { id: "fleet-vehicles", label: "Fleet & Drivers", icon: Truck },
            { id: "history", label: "History", icon: History },
            { id: "settings", label: "Settings", icon: Settings },
          ];

  const moreActive = moreItems.some((m) => m.id === view);

  const tabCls = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 py-1.5 px-0.5 text-[10px] font-semibold transition select-none ${
      active ? "text-green-bright font-bold" : "text-white/60 active:text-white"
    }`;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-[900] w-full max-w-full border-t border-night-line bg-night select-none pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5 w-full items-center">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} className={tabCls(view === t.id)}>
              <span className={`relative flex items-center justify-center rounded-full px-3 py-1 transition ${view === t.id ? "bg-green/25" : ""}`}>
                <t.icon size={18} />
                {t.id === "driver-notifications" && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 font-mono text-[9px] font-bold text-white shadow">
                    {unreadNotificationsCount}
                  </span>
                )}
              </span>
              <span className="truncate max-w-full text-center leading-tight tracking-tight">{t.label}</span>
            </button>
          ))}
          <button onClick={() => setMore(true)} className={tabCls(moreActive)}>
            <span className={`flex items-center justify-center rounded-full px-3 py-1 transition ${moreActive ? "bg-green/25" : ""}`}>
              <MoreHorizontal size={18} />
            </span>
            <span className="truncate max-w-full text-center leading-tight">More</span>
          </button>
        </div>
      </nav>

      {more && (
        <div className="fixed inset-0 z-[1000] bg-ink/60 lg:hidden" onClick={() => setMore(false)}>
          <div
            className="anim-up absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-night-line bg-night p-4 pb-[calc(env(safe-area-inset-bottom)+18px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <p className="font-display text-[14px] font-bold text-white">More Options</p>
              <button
                onClick={() => setMore(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-night-soft hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {moreItems.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setView(m.id);
                    setMore(false);
                  }}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-[13px] font-bold transition ${
                    view === m.id
                      ? "border-green bg-green text-white"
                      : "border-night-line bg-night-soft text-white/75 hover:text-white"
                  }`}
                >
                  <m.icon size={17} /> {m.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center font-mono text-[10px] text-white/40">
              QuantaRoute v1.0 · {role === "fleetmanager" ? "Fleet Dispatch Ops" : "QPSO Engine"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
