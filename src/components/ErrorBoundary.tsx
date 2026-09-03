import { Component, type ReactNode } from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="qr-bg flex min-h-dvh items-center justify-center p-6">
          <div className="anim-pop w-full max-w-md rounded-xl border border-line bg-card p-6 text-center shadow-[0_4px_0_rgba(11,15,14,0.08)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red/10 text-red">
              <ShieldAlert size={22} />
            </span>
            <h1 className="mt-4 font-display text-lg font-bold text-ink">The route engine hit a snag</h1>
            <p className="mt-1 text-[13px] text-ink-soft">
              Something unexpected happened while rendering. Your scenario is safe — reload to continue.
            </p>
            <pre className="mt-3 max-h-28 overflow-auto rounded-lg bg-ink px-3 py-2 text-left font-mono text-[10px] leading-relaxed text-green-bright">
              {this.state.error.message}
            </pre>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => this.setState({ error: null })}
                className="rounded-lg border border-line bg-white px-4 py-2.5 text-[13px] font-bold text-ink transition hover:border-ink"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 rounded-lg bg-green px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_3px_0_#0c7a37] transition active:translate-y-0.5 active:shadow-none"
              >
                <RefreshCw size={14} /> Reload QuantaRoute
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
