import { OA_QUESTION_COUNT } from "../shared/constants";
import type { Outcome, Problem, Session, SessionConfig } from "../shared/types";
import { pickNext, pickSet, type Rng } from "./picker";

// Pure session transitions. The service worker handles storage and tabs around these.

export class NoProblemsError extends Error {
  constructor() {
    super("No free problems match those topics and difficulties.");
  }
}

export function createSession(
  config: SessionConfig,
  tabId: number,
  problems: Problem[],
  now: number,
  rng: Rng = Math.random,
): Session {
  const queue =
    config.mode === "oa"
      ? pickSet(problems, config, OA_QUESTION_COUNT, rng)
      : [pickNext(problems, config, new Set(), rng)].filter((p): p is Problem => p !== null);
  if (queue.length === 0) throw new NoProblemsError();

  return {
    id: crypto.randomUUID(),
    config,
    tabId,
    status: "active",
    queue,
    index: 0,
    currentSubmissions: [],
    currentStartedAt: now,
    results: [],
    startedAt: now,
  };
}

export function currentProblem(session: Session): Problem | null {
  return session.status === "active" ? (session.queue[session.index] ?? null) : null;
}

/** Records how the current problem ended. */
function closeCurrent(session: Session, outcome: Outcome, now: number): Session {
  const problem = currentProblem(session);
  if (!problem) return session;
  return {
    ...session,
    results: [
      ...session.results,
      {
        problem,
        outcome,
        submissions: session.currentSubmissions,
        startedAt: session.currentStartedAt,
        endedAt: now,
      },
    ],
    currentSubmissions: [],
  };
}

function finish(session: Session, now: number): Session {
  return { ...session, status: "finished", endedAt: now };
}

/**
 * Closes the current problem with `outcome` and moves on.
 * OA walks the pre-picked queue; practice picks a fresh unseen problem.
 * Finishes the session when there's nothing left.
 */
export function advance(
  session: Session,
  outcome: Outcome,
  problems: Problem[],
  now: number,
  rng: Rng = Math.random,
): Session {
  if (session.status !== "active") return session;
  let next = closeCurrent(session, outcome, now);

  if (next.config.mode === "practice") {
    const seen = new Set(next.queue.map((p) => p.id));
    const problem = pickNext(problems, next.config, seen, rng);
    if (!problem) return finish(next, now);
    next = { ...next, queue: [...next.queue, problem] };
  }

  const index = next.index + 1;
  if (index >= next.queue.length) return finish({ ...next, index }, now);
  return { ...next, index, currentStartedAt: now };
}

/**
 * Ends early. The current problem is recorded as skipped; in OA, so is every unstarted one,
 * so results always cover the full set.
 */
export function endSession(session: Session, now: number): Session {
  if (session.status !== "active") return session;
  let next = closeCurrent(session, "skipped", now);
  if (next.config.mode === "oa") {
    const unstarted = next.queue.slice(next.index + 1).map((problem) => ({
      problem,
      outcome: "skipped" as const,
      submissions: [],
      startedAt: now,
      endedAt: now,
    }));
    next = { ...next, results: [...next.results, ...unstarted] };
  }
  return finish(next, now);
}

/** When the current OA problem runs out of time (epoch ms). Null in practice or when not active. */
export function deadlineFor(session: Session): number | null {
  const problem = currentProblem(session);
  if (!problem || session.config.mode !== "oa") return null;
  return session.currentStartedAt + session.config.timeLimits[problem.difficulty] * 60_000;
}

/** Outcome when moving on by choice: accepted if any submission was, otherwise failed. */
export function outcomeFromSubmissions(session: Session): Outcome {
  return session.currentSubmissions.some((s) => s.verdict === "Accepted") ? "accepted" : "failed";
}
