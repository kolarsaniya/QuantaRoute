import { useState } from "react";
import { History, LayoutDashboard, Map, MoreHorizontal, Package, Settings, Waypoints, X } from "lucide-react";
import type { View } from "./Sidebar";

const TABS: { id: View; label: string; icon: typeof Map }[] = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard },
  { id: "deliveries", label: "Stops", icon: Package },
  { id: "tracking", label: "Track", icon: Waypoints },
  { id: "plan", label: "Plan", icon: Map },
];

export function BottomNav({ view, setView }: { view: View; setView: (v: View) => void }) {
  const [more, setMore] = useState(false);
  const moreActive = view === "history" || view === "settings";

  const tabCls = (active: boolean) =>
    `flex flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition ${
      active ? "text-green-bright" : "text-white/55 active:text-white"
    }`;

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-[900] border-t border-night-line bg-night pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setView(t.id)} className={tabCls(view === t.id)}>
              <span className={`rounded-full px-3.5 py-1 transition ${view === t.id ? "bg-green/25" : ""}`}>
                <t.icon size={19} />
              </span>
              {t.label}
            </button>
          ))}
          <button onClick={() => setMore(true)} className={tabCls(moreActive)}>
            <span className={`rounded-full px-3.5 py-1 transition ${moreActive ? "bg-green/25" : ""}`}>
              <MoreHorizontal size={19} />
            </span>
            More
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
              <p className="font-display text-[14px] font-bold text-white">More</p>
              <button
                onClick={() => setMore(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-night-soft hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(
                [
                  { id: "history" as View, label: "History", icon: History },
                  { id: "settings" as View, label: "Settings", icon: Settings },
                ]
              ).map((m) => (
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
              QuantaRoute v1.0 · QPSO engine
            </p>
          </div>
        </div>
      )}
    </>
  );
}
