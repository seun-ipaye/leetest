import { describe, expect, it } from "vitest";
import { formatDuration, sessionScore, topicStats } from "./stats";
import type { Outcome, ProblemResult, Session } from "./types";

const result = (tags: string[], outcome: Outcome): ProblemResult => ({
  problem: { id: 1, slug: "x", title: "X", difficulty: "Easy", tags, paidOnly: false },
  outcome,
  submissions: [],
  startedAt: 0,
  endedAt: 1000,
});

const session = (results: ProblemResult[]): Session => ({
  id: "s",
  config: { mode: "practice", topics: [], difficulties: [] },
  tabId: 1,
  status: "finished",
  queue: [],
  index: 0,
  currentSubmissions: [],
  currentStartedAt: 0,
  results,
  startedAt: 0,
});

describe("sessionScore", () => {
  it("counts accepted out of all results", () => {
    const s = session([result([], "accepted"), result([], "failed"), result([], "skipped")]);
    expect(sessionScore(s)).toEqual({ accepted: 1, total: 3 });
  });
});

describe("topicStats", () => {
  const history = [
    session([
      result(["Graph", "DFS"], "failed"),
      result(["Graph"], "timed-out"),
      result(["Array"], "accepted"),
    ]),
    session([
      result(["Graph"], "accepted"),
      result(["Array"], "accepted"),
      result(["Array", "DFS"], "accepted"),
    ]),
  ];

  it("ranks weakest topics first", () => {
    expect(topicStats(history).map((t) => [t.topic, t.accepted, t.attempted])).toEqual([
      ["Graph", 1, 3],
      ["Array", 3, 3],
    ]);
  });

  it("drops topics below the attempt threshold", () => {
    expect(topicStats(history).some((t) => t.topic === "DFS")).toBe(false);
    expect(topicStats(history, 2).some((t) => t.topic === "DFS")).toBe(true);
  });
});

describe("formatDuration", () => {
  it("scales units", () => {
    expect(formatDuration(42_000)).toBe("42s");
    expect(formatDuration(65_000)).toBe("1m 05s");
    expect(formatDuration(3_720_000)).toBe("1h 2m");
  });
});
