import { useEffect, useMemo, useState } from "react";
import { clearHistory, loadHistory } from "../shared/storage";
import { sessionScore, topicStats } from "../shared/stats";
import type { Session } from "../shared/types";
import Results from "./Results";

/** How many recent sessions the score trend covers. */
const TREND_LENGTH = 10;

export default function History({ onBack }: { onBack: () => void }) {
  const [history, setHistory] = useState<Session[] | null>(null);
  const [open, setOpen] = useState<Session | null>(null);

  useEffect(() => {
    loadHistory().then(setHistory);
  }, []);

  const weak = useMemo(() => (history ? topicStats(history).slice(0, 5) : []), [history]);
  const trend = useMemo(() => (history ?? []).slice(0, TREND_LENGTH).reverse(), [history]);

  if (open) {
    return (
      <Results
        session={open}
        actions={
          <button className="secondary" onClick={() => setOpen(null)}>
            Back to history
          </button>
        }
      />
    );
  }

  if (!history) return null;

  async function clear() {
    if (!confirm("Delete all session history?")) return;
    await clearHistory();
    setHistory([]);
  }

  return (
    <div className="history">
      <button className="link back" onClick={onBack}>
        ← Back
      </button>

      {history.length === 0 ? (
        <p className="muted">No finished sessions yet.</p>
      ) : (
        <>
          <section>
            <h2>Recent scores</h2>
            <div className="trend" aria-label="Accept rate of recent sessions, oldest to newest">
              {trend.map((s) => {
                const { accepted, total } = sessionScore(s);
                const rate = total ? accepted / total : 0;
                return (
                  <span
                    key={s.id}
                    className="bar"
                    style={{ height: `${Math.max(rate * 100, 4)}%` }}
                    title={`${accepted}/${total} · ${new Date(s.startedAt).toLocaleDateString()}`}
                  />
                );
              })}
            </div>
          </section>

          {weak.length > 0 && (
            <section>
              <h2>Weakest topics</h2>
              <ul className="weak">
                {weak.map((t) => (
                  <li key={t.topic}>
                    <span>{t.topic}</span>
                    <span className="muted">
                      {t.accepted}/{t.attempted} · {Math.round(t.rate * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2>Sessions</h2>
            <ul className="sessions">
              {history.map((s) => {
                const { accepted, total } = sessionScore(s);
                return (
                  <li key={s.id}>
                    <button className="session-row" onClick={() => setOpen(s)}>
                      <span>
                        {s.config.mode === "oa" ? "OA" : "Practice"}
                        <span className="muted"> · {new Date(s.startedAt).toLocaleString()}</span>
                      </span>
                      <span className="mono">
                        {accepted}/{total}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button className="link danger" onClick={clear}>
              Clear history
            </button>
          </section>
        </>
      )}
    </div>
  );
}
