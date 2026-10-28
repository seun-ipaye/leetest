import rawProblems from "../../data/problems.json";
import type { Problem, SessionConfig } from "../shared/types";

export const PROBLEMS = rawProblems as Problem[];

/** Random number in [0, 1). Injectable so tests are deterministic. */
export type Rng = () => number;

/** Free problems matching any selected topic and any selected difficulty. Empty filter = any. */
export function filterProblems(
  problems: Problem[],
  { topics, difficulties }: Pick<SessionConfig, "topics" | "difficulties">,
): Problem[] {
  return problems.filter(
    (p) =>
      !p.paidOnly &&
      (difficulties.length === 0 || difficulties.includes(p.difficulty)) &&
      (topics.length === 0 || p.tags.some((t) => topics.includes(t))),
  );
}

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** OA: pick `count` distinct problems up front. Returns fewer if the pool is smaller. */
export function pickSet(
  problems: Problem[],
  config: SessionConfig,
  count: number,
  rng: Rng = Math.random,
): Problem[] {
  return shuffle(filterProblems(problems, config), rng).slice(0, count);
}

/** Practice: pick one problem not seen yet this session, or null when the pool runs out. */
export function pickNext(
  problems: Problem[],
  config: SessionConfig,
  seenIds: ReadonlySet<number>,
  rng: Rng = Math.random,
): Problem | null {
  const pool = filterProblems(problems, config).filter((p) => !seenIds.has(p.id));
  return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
}

/** Free problems per tag, most common first, for the topic picker. */
export function topicCounts(problems: Problem[]): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of problems) {
    if (p.paidOnly) continue;
    for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

/** Every tag in the bank, sorted, for the topic picker. */
export function allTopics(problems: Problem[]): string[] {
  return [...new Set(problems.flatMap((p) => p.tags))].sort();
}
