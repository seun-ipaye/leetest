import { describe, expect, it } from "vitest";
import type { Problem, SessionConfig } from "../shared/types";
import { allTopics, filterProblems, pickNext, pickSet, PROBLEMS } from "./picker";

const p = (
  id: number,
  difficulty: Problem["difficulty"],
  tags: string[],
  paidOnly = false,
): Problem => ({
  id,
  slug: `p-${id}`,
  title: `P${id}`,
  difficulty,
  tags,
  paidOnly,
});

const bank = [
  p(1, "Easy", ["Array"]),
  p(2, "Medium", ["Graph", "BFS"]),
  p(3, "Medium", ["Array", "DP"]),
  p(4, "Hard", ["Graph"]),
  p(5, "Medium", ["Graph"], true),
];

describe("filterProblems", () => {
  it("drops paid-only problems even with no filters", () => {
    expect(filterProblems(bank, { topics: [], difficulties: [] }).map((x) => x.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("matches any selected topic and any selected difficulty", () => {
    const ids = filterProblems(bank, { topics: ["Graph"], difficulties: ["Medium", "Hard"] }).map(
      (x) => x.id,
    );
    expect(ids).toEqual([2, 4]);
  });
});

describe("pickSet", () => {
  it("returns distinct problems capped at the pool size", () => {
    const set = pickSet(bank, { mode: "practice", topics: [], difficulties: [] }, 10);
    expect(set).toHaveLength(4);
    expect(new Set(set.map((x) => x.id)).size).toBe(4);
  });

  it("is deterministic with a fixed rng", () => {
    const config: SessionConfig = { mode: "practice", topics: [], difficulties: [] };
    expect(pickSet(bank, config, 3, () => 0)).toEqual(pickSet(bank, config, 3, () => 0));
  });
});

describe("pickNext", () => {
  const config: SessionConfig = { mode: "practice", topics: ["Graph"], difficulties: [] };

  it("skips problems already seen", () => {
    expect(pickNext(bank, config, new Set([2]))?.id).toBe(4);
  });

  it("returns null when the pool is exhausted", () => {
    expect(pickNext(bank, config, new Set([2, 4]))).toBeNull();
  });
});

describe("bundled problems.json", () => {
  it("has unique ids and slugs", () => {
    expect(new Set(PROBLEMS.map((x) => x.id)).size).toBe(PROBLEMS.length);
    expect(new Set(PROBLEMS.map((x) => x.slug)).size).toBe(PROBLEMS.length);
  });

  it("exposes sorted topics", () => {
    const topics = allTopics(PROBLEMS);
    expect(topics).toEqual([...topics].sort());
  });
});
