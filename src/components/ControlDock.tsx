import { Loader2, Minus, Navigation, Plus } from "lucide-react";

interface Props {
  fleet: number;
  setFleet: (n: number) => void;
  solving: boolean;
  onOptimize: () => void;
  capacity: number;
}

export function ControlDock({ fleet, setFleet, solving, onOptimize, capacity }: Props) {
  return (
    <section className="anim-up rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(11,15,14,0.05)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[14px] font-bold uppercase tracking-wide text-ink">Dispatch control</h2>
        <span className="font-mono text-[10px] text-ink-faint">live scenario</span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-paper px-3 py-2.5">
        <div>
          <p className="text-[13px] font-semibold text-ink">Fleet size</p>
          <p className="font-mono text-[10px] text-ink-faint">capacity {capacity} u / truck</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFleet(Math.max(1, fleet - 1))}
            disabled={fleet <= 1}
            aria-label="Remove truck"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:border-ink hover:bg-ink hover:text-white disabled:opacity-30 disabled:hover:border-line disabled:hover:bg-white disabled:hover:text-ink sm:h-8 sm:w-8"
          >
            <Minus size={15} />
          </button>
          <span className="w-6 text-center font-display text-xl font-bold text-green-deep">{fleet}</span>
          <button
            onClick={() => setFleet(fleet + 1)}
            aria-label="Add truck"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white text-ink transition hover:border-ink hover:bg-ink hover:text-white sm:h-8 sm:w-8"
          >
            <Plus size={15} />
          </button>
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
        unlimited fleet · stops & incidents update weights live
      </p>
    </section>
  );
}
