import { useState } from "react";
import { ChevronDown, CircleHelp, Sun, Sunset, Sunrise } from "lucide-react";
import logo from "../assets/logo.png";
import type { Incident } from "../lib/types";

interface Props {
  incidents: Incident[];
  onHelp: () => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning, Driver!", icon: Sunrise };
  if (h < 17) return { text: "Good Afternoon, Driver!", icon: Sun };
  return { text: "Good Evening, Driver!", icon: Sunset };
}

export function TopBar({ incidents, onHelp }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const g = greeting();
  const GreetIcon = g.icon;

  const traffic =
    incidents.length === 0
      ? { label: "Smooth", dot: "bg-green-bright", text: "text-green-bright" }
      : incidents.some((i) => i.kind === "accident")
        ? { label: "Blocked", dot: "bg-red", text: "text-red" }
        : { label: "Busy", dot: "bg-amber", text: "text-amber" };

  return (
    <header className="sticky top-0 z-50 border-b border-night-line bg-night">
      <div className="flex items-center gap-3 px-4 py-2.5 lg:px-6">
        {/* brand */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <img src={logo} alt="QuantaRoute logo" className="h-9 w-9 rounded-xl border border-night-line object-cover sm:h-10 sm:w-10" />
          <div className="leading-none">
            <h1 className="font-display text-base font-bold tracking-wide text-white">
              QUANTA<span className="text-green-bright">ROUTE</span>
            </h1>
            <p className="mt-1 text-[11px] font-medium text-white/55">Smart Route Assistant</p>
          </div>
        </div>

        {/* greeting chip */}
        <div className="ml-2 hidden items-center gap-3 rounded-xl bg-night-soft px-4 py-2 md:flex">
          <GreetIcon size={18} className="text-amber" />
          <div className="leading-tight">
            <p className="text-[13px] font-bold text-white">{g.text}</p>
            <p className="text-[11px] text-white/50">Plan smart. Deliver better.</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          {/* live traffic */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="leading-tight">
              <p className="text-[11px] font-semibold text-white/70">Live Traffic</p>
              <p className={`flex items-center gap-1.5 text-[12px] font-bold ${traffic.text}`}>
                <span className={`h-2 w-2 rounded-full ${traffic.dot} qr-blink`} /> {traffic.label}
              </p>
            </div>
          </div>

          <button
            onClick={onHelp}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold text-white/75 transition hover:bg-night-soft hover:text-white"
          >
            <CircleHelp size={16} /> <span className="hidden lg:inline">Help</span>
          </button>

          {/* driver menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-night-line bg-night-soft px-3 py-2 text-[13px] font-semibold text-white transition hover:border-green"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-[11px] font-bold text-white">
                DR
              </span>
              <span className="hidden sm:inline">Driver</span>
              <ChevronDown size={14} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>
            {menuOpen && (
              <div className="anim-pop absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-night-line bg-night-soft shadow-xl">
                {["Dispatch profile", "Shift summary", "Sign out"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setMenuOpen(false)}
                    className="block w-full px-4 py-2.5 text-left text-[13px] font-medium text-white/80 transition hover:bg-night hover:text-green-bright"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
