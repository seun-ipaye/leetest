import type { Submission, Verdict } from "../shared/types";

// LeetCode judges a submit asynchronously: the page polls
// https://leetcode.com/submissions/detail/<id>/check/ until `state` is "SUCCESS".
// "Run" uses the same endpoint with ids like "runcode_…", which we ignore.

export const CHECK_URL_PATTERN = "https://leetcode.com/submissions/detail/*/check/*";

const VERDICTS: readonly Verdict[] = [
  "Accepted",
  "Wrong Answer",
  "Time Limit Exceeded",
  "Memory Limit Exceeded",
  "Output Limit Exceeded",
  "Runtime Error",
  "Compile Error",
];

/** The submission id in a check URL, or null for Run requests and anything else. */
export function submissionIdFromUrl(url: string): string | null {
  const match = /\/submissions\/detail\/([^/]+)\/check\/?/.exec(url);
  return match && /^\d+$/.test(match[1]) ? match[1] : null;
}

/** "two-sum" from https://leetcode.com/problems/two-sum/description/ */
export function slugFromUrl(url: string | undefined): string | null {
  return (url && /leetcode\.com\/problems\/([^/?#]+)/.exec(url)?.[1]) || null;
}

interface CheckResponse {
  state?: string;
  status_msg?: string;
  status_runtime?: string;
  status_memory?: string;
}

/** A finished verdict from a check response, or null while it's still judging. */
export function parseCheck(body: CheckResponse, slug: string, now: number): Submission | null {
  if (body.state !== "SUCCESS") return null;
  const verdict = VERDICTS.find((v) => v === body.status_msg);
  if (!verdict) {
    console.warn("[LeetTest] unknown verdict:", body.status_msg);
    return null;
  }
  return {
    slug,
    verdict,
    runtime: body.status_runtime || undefined,
    memory: body.status_memory || undefined,
    submittedAt: now,
  };
}
