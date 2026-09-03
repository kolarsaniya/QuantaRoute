import { useEffect, useRef, useState } from "react";
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { FlaskConical } from "lucide-react";
import type { BenchmarkResult } from "../lib/types";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

interface Props {
  results: BenchmarkResult[];
  greedyCost: number | null;
  solveMs: number | null;
}

export function Benchmark({ results, greedyCost, solveMs }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);
  const [progress, setProgress] = useState(0);

  const maxLen = Math.max(0, ...results.map((r) => r.history.length));

  // progressive reveal of convergence curves
  useEffect(() => {
    setProgress(0);
    if (maxLen === 0) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= maxLen) {
          clearInterval(t);
          return p;
        }
        return p + 1;
      });
    }, 22);
    return () => clearInterval(t);
  }, [results, maxLen]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, {
      type: "line",
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 10, boxHeight: 10, font: { family: "JetBrains Mono", size: 10 }, padding: 12 },
          },
          tooltip: {
            backgroundColor: "#0e1116",
            titleFont: { family: "JetBrains Mono", size: 10 },
            bodyFont: { family: "JetBrains Mono", size: 10 },
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(1)} min`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "iteration", font: { family: "JetBrains Mono", size: 9 } },
            grid: { color: "rgba(11,15,14,0.05)" },
            ticks: { font: { family: "JetBrains Mono", size: 9 }, maxTicksLimit: 8 },
          },
          y: {
            beginAtZero: false,
            grace: "8%",
            title: { display: true, text: "best cost (min)", font: { family: "JetBrains Mono", size: 9 } },
            grid: { color: "rgba(11,15,14,0.05)" },
            ticks: { font: { family: "JetBrains Mono", size: 9 } },
          },
        },
      },
    });
    chartRef.current = chart;
    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = Array.from({ length: progress }, (_, i) => i);
    const ds: Chart<"line">["data"]["datasets"] = results.map((r) => ({
      label: r.algorithm,
      data: r.history.slice(0, progress),
      borderColor: r.color,
      backgroundColor: `${r.color}18`,
      borderWidth: r.algorithm === "QPSO" ? 2.5 : 1.8,
      pointRadius: 0,
      tension: 0.3,
      fill: r.algorithm === "QPSO",
    }));
    if (greedyCost != null && progress > 0) {
      ds.push({
        label: "Greedy (NN)",
        data: Array.from({ length: progress }, () => greedyCost),
        borderColor: "#8a919e",
        borderDash: [6, 5],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      });
    }
    chart.data.datasets = ds;
    chart.update("none");
  }, [results, progress, greedyCost]);

  const maxCost = Math.max(greedyCost ?? 0, ...results.map((r) => r.bestCost), 1);
  const qpso = results.find((r) => r.algorithm === "QPSO");
  const improvement =
    qpso && greedyCost ? Math.max(0, ((greedyCost - qpso.bestCost) / greedyCost) * 100) : 0;

  return (
    <section className="anim-up rounded-xl border border-line bg-card p-4 shadow-[0_2px_0_rgba(14,17,22,0.06)]" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wide text-ink">
          <FlaskConical size={14} className="text-blue" /> Convergence benchmark
        </h2>
        {solveMs !== null && (
          <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10px] font-bold text-ink-soft">
            {solveMs} ms
          </span>
        )}
      </div>

      <div className="mt-3 h-44 sm:h-52">
        <canvas ref={canvasRef} />
      </div>

      {/* convergence iteration chips */}
      {results.length > 0 && progress >= maxLen && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {results.map((r) => {
            const conv = r.history.findIndex((v) => Math.abs(v - r.bestCost) < 1e-6);
            return (
              <span
                key={r.algorithm}
                className="rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[10px] font-medium text-ink-soft"
              >
                <span style={{ color: r.color }}>●</span> {r.algorithm} converged @ iter {conv < 0 ? "—" : conv}
              </span>
            );
          })}
        </div>
      )}

      {/* final-cost comparison bars */}
      <div className="mt-4 space-y-2">
        {[...results]
          .sort((a, b) => a.bestCost - b.bestCost)
          .map((r, i) => {
            const best = Math.min(...results.map((x) => x.bestCost));
            const delta = best > 0 ? ((r.bestCost - best) / best) * 100 : 0;
            return (
              <div key={r.algorithm} className="flex items-center gap-2">
                <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-ink-soft">{r.algorithm}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-sm bg-paper">
                  <div
                    className="h-full rounded-sm transition-all duration-1000"
                    style={{ width: `${(r.bestCost / maxCost) * 100}%`, background: r.color }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-[10px] font-bold text-ink">
                  {r.bestCost.toFixed(1)}
                </span>
                <span className="w-14 shrink-0 text-right font-mono text-[9px] text-ink-faint">
                  {i === 0 ? "best" : `+${delta.toFixed(1)}%`}
                </span>
              </div>
            );
          })}
        {greedyCost !== null && (
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 font-mono text-[10px] font-bold text-ink-faint">GREEDY</span>
            <div className="h-3 flex-1 overflow-hidden rounded-sm bg-paper">
              <div
                className="h-full rounded-sm bg-ink-faint transition-all duration-1000"
                style={{ width: `${(greedyCost / maxCost) * 100}%` }}
              />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-[10px] font-bold text-ink-faint">
              {greedyCost.toFixed(1)}
            </span>
            <span className="w-14 shrink-0 text-right font-mono text-[9px] text-ink-faint">baseline</span>
          </div>
        )}
      </div>

      {qpso && (
        <p className="mt-3 rounded-lg bg-green-tint px-3 py-2 font-mono text-[11px] font-medium text-green-deep">
          QPSO beats nearest-neighbour greedy by {improvement.toFixed(1)}% on this instance
          {solveMs !== null && ` · solved in ${solveMs} ms`}.
        </p>
      )}
      <p className="mt-2 font-mono text-[10px] text-ink-faint">
        pop 26 · 70 iters · α-anneal 0.95 → 0.50 · NN warm start (all) · QPSO + hybrid 2-opt refinement
      </p>
    </section>
  );
}
