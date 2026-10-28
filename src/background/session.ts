import type { Outcome, Problem, Session, SessionConfig, Submission } from "../shared/types";
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
      ? pickSet(problems, config, config.questionCount, rng)
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

/** Outcome when moving on: accepted if any submission was, failed if none were, skipped if none made. */
export function outcomeFromSubmissions(session: Session): Outcome {
  if (session.currentSubmissions.length === 0) return "skipped";
  return session.currentSubmissions.some((s) => s.verdict === "Accepted") ? "accepted" : "failed";
}

// Mode rules.
// Practice: Next unlocks only after an Accepted; Skip is the way out otherwise.
// OA: any submit moves straight on, right or wrong.

export class NextLockedError extends Error {
  constructor() {
    super("Get an Accepted submission first, or skip this one.");
  }
}

export function canGoNext(session: Session): boolean {
  if (session.status !== "active") return false;
  return session.config.mode === "oa" || outcomeFromSubmissions(session) === "accepted";
}

/** Moves on by pressing Next. Throws in practice until the problem is Accepted. */
export function next(session: Session, problems: Problem[], now: number, rng?: Rng): Session {
  if (!canGoNext(session)) throw new NextLockedError();
  return advance(session, outcomeFromSubmissions(session), problems, now, rng);
}

/** Records a verdict on the current problem. In OA this also moves to the next one. */
export function applySubmission(
  session: Session,
  submission: Submission,
  problems: Problem[],
  now: number,
  rng?: Rng,
): Session {
  if (currentProblem(session)?.slug !== submission.slug) return session;
  const updated = { ...session, currentSubmissions: [...session.currentSubmissions, submission] };
  if (updated.config.mode !== "oa") return updated;
  return advance(updated, outcomeFromSubmissions(updated), problems, now, rng);
}
