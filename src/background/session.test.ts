import { describe, expect, it } from "vitest";
import { DEFAULT_TIME_LIMITS, OA_QUESTION_COUNT } from "../shared/constants";
import type { Problem, SessionConfig, Submission } from "../shared/types";
import {
  advance,
  createSession,
  currentProblem,
  deadlineFor,
  endSession,
  NoProblemsError,
  outcomeFromSubmissions,
  next,
  applySubmission,
  canGoNext,
  NextLockedError,
} from "./session";

const bank: Problem[] = [1, 2, 3, 4, 5].map((id) => ({
  id,
  slug: `p-${id}`,
  title: `P${id}`,
  difficulty: "Medium",
  tags: ["Array"],
  paidOnly: false,
}));

const practice: SessionConfig = { mode: "practice", topics: [], difficulties: [] };
const oa: SessionConfig = { ...practice, mode: "oa", timeLimits: DEFAULT_TIME_LIMITS };

describe("createSession", () => {
  it("pre-picks the full set for OA", () => {
    const s = createSession(oa, 1, bank, 0);
    expect(s.queue).toHaveLength(OA_QUESTION_COUNT);
    expect(currentProblem(s)).toBe(s.queue[0]);
  });

  it("picks just one problem for practice", () => {
    expect(createSession(practice, 1, bank, 0).queue).toHaveLength(1);
  });

  it("throws when nothing matches", () => {
    expect(() => createSession({ ...practice, topics: ["Nope"] }, 1, bank, 0)).toThrow(
      NoProblemsError,
    );
  });
});

describe("advance", () => {
  it("OA walks the queue, then finishes with a result per problem", () => {
    let s = createSession(oa, 1, bank, 0);
    for (let i = 0; i < OA_QUESTION_COUNT; i++) s = advance(s, "failed", bank, i + 1);
    expect(s.status).toBe("finished");
    expect(s.results.map((r) => r.problem)).toEqual(s.queue);
    expect(currentProblem(s)).toBeNull();
  });

  it("practice keeps picking unseen problems until the pool runs out", () => {
    let s = createSession(practice, 1, bank, 0);
    while (s.status === "active") s = advance(s, "accepted", bank, 1);
    expect(s.results).toHaveLength(bank.length);
    expect(new Set(s.results.map((r) => r.problem.id)).size).toBe(bank.length);
  });

  it("carries submissions into the result and resets them", () => {
    let s = createSession(practice, 1, bank, 0);
    s = {
      ...s,
      currentSubmissions: [{ slug: s.queue[0].slug, verdict: "Accepted", submittedAt: 5 }],
    };
    expect(outcomeFromSubmissions(s)).toBe("accepted");
    s = advance(s, outcomeFromSubmissions(s), bank, 10);
    expect(s.results[0]).toMatchObject({ outcome: "accepted", startedAt: 0, endedAt: 10 });
    expect(s.results[0].submissions).toHaveLength(1);
    expect(s.currentSubmissions).toEqual([]);
    expect(s.currentStartedAt).toBe(10);
  });
});

describe("endSession", () => {
  it("OA marks the current and unstarted problems skipped", () => {
    let s = createSession(oa, 1, bank, 0);
    s = advance(s, "accepted", bank, 1);
    s = endSession(s, 2);
    expect(s.status).toBe("finished");
    expect(s.results.map((r) => r.outcome)).toEqual(["accepted", "skipped", "skipped"]);
  });

  it("practice only records the current problem", () => {
    const s = endSession(createSession(practice, 1, bank, 0), 1);
    expect(s.results.map((r) => r.outcome)).toEqual(["skipped"]);
  });

  it("is a no-op on a finished session", () => {
    const s = endSession(createSession(practice, 1, bank, 0), 1);
    expect(endSession(s, 2)).toBe(s);
  });
});

describe("deadlineFor", () => {
  it("uses the current problem's difficulty limit in OA", () => {
    const limits = { Easy: 10, Medium: 20, Hard: 30 };
    let s = createSession({ ...oa, timeLimits: limits }, 1, bank, 1_000);
    expect(deadlineFor(s)).toBe(1_000 + 20 * 60_000);
    s = advance(s, "failed", bank, 5_000);
    expect(deadlineFor(s)).toBe(5_000 + 20 * 60_000);
  });

  it("is null in practice and once finished", () => {
    expect(deadlineFor(createSession(practice, 1, bank, 0))).toBeNull();
    expect(deadlineFor(endSession(createSession(oa, 1, bank, 0), 1))).toBeNull();
  });
});

describe("mode rules", () => {
  const sub = (slug: string, verdict: Submission["verdict"]): Submission => ({
    slug,
    verdict,
    submittedAt: 1,
  });

  it("practice locks Next until an Accepted", () => {
    let s = createSession(practice, 1, bank, 0);
    expect(() => next(s, bank, 1)).toThrow(NextLockedError);

    s = applySubmission(s, sub(s.queue[0].slug, "Wrong Answer"), bank, 1);
    expect(canGoNext(s)).toBe(false);
    expect(s.index).toBe(0);

    s = applySubmission(s, sub(s.queue[0].slug, "Accepted"), bank, 2);
    expect(canGoNext(s)).toBe(true);
    expect(s.index).toBe(0); // practice never auto-advances

    s = next(s, bank, 3);
    expect(s.results[0]).toMatchObject({ outcome: "accepted" });
    expect(s.results[0].submissions).toHaveLength(2);
  });

  it("practice still allows skipping", () => {
    const s = advance(createSession(practice, 1, bank, 0), "skipped", bank, 1);
    expect(s.results[0].outcome).toBe("skipped");
  });

  it("OA moves on after any submission, right or wrong", () => {
    let s = createSession(oa, 1, bank, 0);
    s = applySubmission(s, sub(s.queue[0].slug, "Wrong Answer"), bank, 1);
    expect(s.index).toBe(1);
    s = applySubmission(s, sub(s.queue[1].slug, "Accepted"), bank, 2);
    expect(s.index).toBe(2);
    expect(s.results.map((r) => r.outcome)).toEqual(["failed", "accepted"]);
  });

  it("OA Next without a submission counts as skipped", () => {
    const s = next(createSession(oa, 1, bank, 0), bank, 1);
    expect(s.results[0].outcome).toBe("skipped");
  });

  it("ignores submissions for a different problem", () => {
    const s = createSession(oa, 1, bank, 0);
    expect(applySubmission(s, sub("not-this-one", "Accepted"), bank, 1)).toBe(s);
  });
});
