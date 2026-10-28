import type { Outcome, ProblemResult, Session } from "./types";

export interface Score {
  accepted: number;
  total: number;
}

export function sessionScore(session: Session): Score {
  return {
    accepted: session.results.filter((r) => r.outcome === "accepted").length,
    total: session.results.length,
  };
}

export const resultDuration = (r: ProblemResult) => r.endedAt - r.startedAt;

export const OUTCOME_LABELS: Record<Outcome, string> = {
  accepted: "Accepted",
  failed: "Not accepted",
  skipped: "Skipped",
  "timed-out": "Timed out",
};

export interface TopicStat {
  topic: string;
  attempted: number;
  accepted: number;
  rate: number;
}

/**
 * Accept rate per topic across all finished sessions, weakest first.
 * Topics with fewer than `minAttempts` problems are left out as too noisy.
 */
export function topicStats(history: Session[], minAttempts = 3): TopicStat[] {
  const byTopic = new Map<string, { attempted: number; accepted: number }>();
  for (const session of history) {
    for (const r of session.results) {
      for (const topic of r.problem.tags) {
        const stat = byTopic.get(topic) ?? { attempted: 0, accepted: 0 };
        stat.attempted++;
        if (r.outcome === "accepted") stat.accepted++;
        byTopic.set(topic, stat);
      }
    }
  }
  return [...byTopic]
    .filter(([, s]) => s.attempted >= minAttempts)
    .map(([topic, s]) => ({ topic, ...s, rate: s.accepted / s.attempted }))
    .sort((a, b) => a.rate - b.rate || b.attempted - a.attempted);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
