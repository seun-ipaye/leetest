import type { Difficulty, TimeLimits } from "./types";

export const DIFFICULTIES: readonly Difficulty[] = ["Easy", "Medium", "Hard"];

export const DEFAULT_TIME_LIMITS: TimeLimits = { Easy: 10, Medium: 20, Hard: 30 };

export const DEFAULT_OA_QUESTION_COUNT = 3;
export const MAX_OA_QUESTION_COUNT = 20;

export const problemUrl = (slug: string) => `https://leetcode.com/problems/${slug}/`;
