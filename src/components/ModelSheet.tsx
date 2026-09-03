import { useState } from "react";
import { ChevronDown, Sigma } from "lucide-react";

const DELIVERABLES = [
  "Graph-based network model",
  "Mathematical formulation",
  "QPSO algorithm module",
  "Software prototype",
  "Live demonstration",
];

export function ModelSheet() {
  const [open, setOpen] = useState(false);
  return (
    <section
      className="anim-up overflow-hidden rounded-xl border border-line bg-card shadow-[0_2px_0_rgba(14,17,22,0.06)]"
      style={{ animationDelay: "240ms" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-paper"
      >
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink">
          <Sigma size={14} className="text-orange" /> Optimization model
        </h2>
        <ChevronDown size={16} className={`text-ink-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="anim-up border-t border-line px-4 py-4">
          <p className="text-[12px] font-semibold text-ink-soft">Objective — minimize total congested travel time:</p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-ink px-3 py-3 font-mono text-[11px] leading-relaxed text-paper">
{`min  Σₖ Σᵢ Σⱼ  tᵢ(τ) · xⱼₖ

s.t. Σₖ Σⱼ xᵢⱼₖ = 1        ∀ customers i   (visit once)
     Σᵢ d · zₖ ≤ Qₖ       ∀ vehicles k    (capacity)
     Σᵢ Σⱼ xᵢⱼₖ ≥ 1         ∀ S ⊂ C         (subtour elim.)
     xᵢⱼₖ ∈ {0,1}`}
          </pre>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-faint">
            tᵢⱼ(τ) = (dᵢ · ρ / v₀) · c(midᵢⱼ, τ) — edge weight updates dynamically as incidents are injected; c(·) is a
            Gaussian congestion field around each traffic jam or accident.
          </p>

          <p className="mt-4 text-[12px] font-semibold text-ink-soft">Deliverables covered:</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DELIVERABLES.map((d, i) => (
              <span
                key={d}
                className="rounded-full border border-line bg-paper px-2.5 py-1 font-mono text-[10px] font-medium text-ink-soft"
              >
                {i + 1}. {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
