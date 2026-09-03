import logo from "../assets/logo.png";
import { Activity } from "lucide-react";

export function Header({ solving }: { solving: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <img
          src={logo}
          alt="QuantaRoute logo"
          className="h-9 w-9 rounded-lg border border-line bg-white object-cover"
        />
        <div className="leading-none">
          <h1 className="font-display text-lg font-bold tracking-tight">
            Quanta<span className="text-blue">Route</span>
          </h1>
          <p className="mt-0.5 hidden text-[11px] font-medium text-ink-faint sm:block">
            Quantum-inspired traffic route optimization
          </p>
        </div>
        <span className="ml-1 hidden rounded-full border border-line bg-white px-2.5 py-1 font-mono text-[10px] font-medium text-ink-soft md:inline-block">
          QPSO · VRP-SOLVER v1.0
        </span>
        <div className="ml-auto flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            {solving && <span className="qr-pulse bg-amber" />}
            <span
              className={`relative h-2 w-2 rounded-full ${solving ? "bg-amber" : "bg-green"}`}
            />
          </span>
          <span className="font-mono text-[11px] font-medium text-ink-soft">
            {solving ? "solving…" : "engine ready"}
          </span>
          <Activity size={13} className={solving ? "text-amber" : "text-green"} />
        </div>
      </div>
    </header>
  );
}
