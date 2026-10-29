import { describe, expect, it } from "vitest";
import { parseCheck, slugFromUrl, submissionIdFromUrl } from "./submissions";

describe("submissionIdFromUrl", () => {
  it("reads numeric submit ids", () => {
    expect(submissionIdFromUrl("https://leetcode.com/submissions/detail/1234567/check/")).toBe(
      "1234567",
    );
  });

  it("reads the versioned check URL", () => {
    expect(
      submissionIdFromUrl("https://leetcode.com/submissions/detail/2184346925/v2/check/"),
    ).toBe("2184346925");
  });

  it("ignores Run requests", () => {
    expect(
      submissionIdFromUrl("https://leetcode.com/submissions/detail/runcode_17_abc/check/"),
    ).toBeNull();
  });
});

describe("slugFromUrl", () => {
  it("reads the slug from any problem page", () => {
    expect(slugFromUrl("https://leetcode.com/problems/two-sum/description/")).toBe("two-sum");
    expect(slugFromUrl("https://leetcode.com/problems/two-sum/submissions/99/")).toBe("two-sum");
  });

  it("is null off problem pages", () => {
    expect(slugFromUrl("https://leetcode.com/problemset/")).toBeNull();
    expect(slugFromUrl(undefined)).toBeNull();
  });
});

describe("parseCheck", () => {
  it("waits while judging", () => {
    expect(parseCheck({ state: "PENDING" }, "two-sum", 0)).toBeNull();
    expect(parseCheck({ state: "STARTED" }, "two-sum", 0)).toBeNull();
  });

  it("returns the verdict with runtime and memory", () => {
    const body = {
      state: "SUCCESS",
      status_msg: "Accepted",
      status_runtime: "3 ms",
      status_memory: "17.7 MB",
    };
    expect(parseCheck(body, "two-sum", 5)).toEqual({
      slug: "two-sum",
      verdict: "Accepted",
      runtime: "3 ms",
      memory: "17.7 MB",
      submittedAt: 5,
    });
  });

  it("handles failing verdicts without stats", () => {
    expect(
      parseCheck({ state: "SUCCESS", status_msg: "Wrong Answer", status_runtime: "" }, "x", 0),
    ).toMatchObject({ verdict: "Wrong Answer", runtime: undefined });
  });

  it('drops "N/A" stats', () => {
    const body = {
      state: "SUCCESS",
      status_msg: "Runtime Error",
      status_runtime: "N/A",
      status_memory: "N/A",
    };
    expect(parseCheck(body, "x", 0)).toMatchObject({ runtime: undefined, memory: undefined });
  });

  it("ignores verdicts it doesn't know", () => {
    expect(parseCheck({ state: "SUCCESS", status_msg: "Something New" }, "x", 0)).toBeNull();
  });
});
