export type Difficulty = "Easy" | "Medium" | "Hard";

/** One entry in data/problems.json. */
export interface Problem {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  paidOnly: boolean;
}

/** Minutes allowed per question, by difficulty. OA mode only. */
export type TimeLimits = Record<Difficulty, number>;

interface BaseConfig {
  topics: string[]; // empty = any topic
  difficulties: Difficulty[]; // empty = any difficulty
}

/** Practice: untimed, endless, must get Accepted (or skip) to move on. */
export interface PracticeConfig extends BaseConfig {
  mode: "practice";
}

/** OA: set number of questions, timed, any submit moves on, results shown at the end. */
export interface OAConfig extends BaseConfig {
  mode: "oa";
  questionCount: number;
  timeLimits: TimeLimits;
}

export type SessionConfig = PracticeConfig | OAConfig;
export type Mode = SessionConfig["mode"];

/** Verdict text as LeetCode shows it after a submit. */
export type Verdict =
  | "Accepted"
  | "Wrong Answer"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Output Limit Exceeded"
  | "Runtime Error"
  | "Compile Error";

export interface Submission {
  slug: string;
  verdict: Verdict;
  runtime?: string;
  memory?: string;
  submittedAt: number;
}

export type Outcome = "accepted" | "failed" | "skipped" | "timed-out";

export interface ProblemResult {
  problem: Problem;
  outcome: Outcome;
  submissions: Submission[];
  startedAt: number;
  endedAt: number;
}

export interface Session {
  id: string;
  config: SessionConfig;
  tabId: number;
  status: "active" | "finished";
  /** OA: the full pre-picked set. Practice: filled lazily as you go. */
  queue: Problem[];
  index: number;
  /** Submissions on the current problem so far. */
  currentSubmissions: Submission[];
  currentStartedAt: number;
  results: ProblemResult[];
  startedAt: number;
  endedAt?: number;
}

/** User settings that persist between sessions. */
export interface Settings {
  timeLimits: TimeLimits;
  oaQuestionCount: number;
  lastConfig?: SessionConfig;
}
