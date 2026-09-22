import { CheckCircle2, Loader2, Navigation, Sparkles } from "lucide-react";

interface Props {
  fleet?: number;
  setFleet?: (n: number) => void;
  solving: boolean;
  onOptimize: () => void;
  capacity?: number;
}

export function ControlDock({ solving, onOptimize }: Props) {
  return (
    <section className="anim-up rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[14px] font-bold uppercase tracking-wide text-ink">Dispatch control</h2>
        <span className="font-mono text-[10px] text-ink-faint">live scenario</span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-paper px-3.5 py-3">
        <div>
          <p className="text-[13px] font-semibold text-ink flex items-center gap-1.5">
            <Sparkles size={14} className="text-green" /> Route Optimization
          </p>
          <p className="font-mono text-[10px] text-ink-soft">QPSO Algorithmic Engine</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-green/10 border border-green/30 px-2.5 py-1 text-[11px] font-bold text-green-deep">
          <CheckCircle2 size={13} className="text-green" /> Shortest Path
        </div>
      </div>

      <button
        onClick={onOptimize}
        disabled={solving}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green py-3 font-display text-sm font-bold text-white shadow-[0_4px_0_#0c7a37] transition hover:bg-green-deep active:translate-y-0.5 active:shadow-[0_2px_0_#0c7a37] disabled:opacity-70"
      >
        {solving ? <Loader2 size={16} className="qr-spin" /> : <Navigation size={16} />}
        {solving ? "Solving…" : "Re-optimize now"}
      </button>
      <p className="mt-2 text-center font-mono text-[10px] text-ink-faint">
        Dynamic real-time routing · Automatically balanced for shortest paths
      </p>
    </section>
  );
}
