import { DEFAULT_OA_QUESTION_COUNT, DEFAULT_TIME_LIMITS } from "./constants";
import type { Session, Settings } from "./types";

/** Everything persisted in chrome.storage.local, by key. */
interface Schema {
  session: Session | null;
  settings: Settings;
  history: Session[];
}

const DEFAULTS: Schema = {
  session: null,
  settings: { timeLimits: DEFAULT_TIME_LIMITS, oaQuestionCount: DEFAULT_OA_QUESTION_COUNT },
  history: [],
};

/** Oldest finished sessions are dropped past this many. */
export const HISTORY_LIMIT = 200;

async function get<K extends keyof Schema>(key: K): Promise<Schema[K]> {
  const stored = await chrome.storage.local.get(key);
  return (stored[key] as Schema[K] | undefined) ?? DEFAULTS[key];
}

function set<K extends keyof Schema>(key: K, value: Schema[K]): Promise<void> {
  return chrome.storage.local.set({ [key]: value });
}

// Active session. Lives in storage so it survives the service worker being shut down.
export const loadSession = () => get("session");
export const saveSession = (session: Session) => set("session", session);
export const clearSession = () => set("session", null);

export async function loadSettings(): Promise<Settings> {
  const settings = await get("settings");
  // Merge so limits added later still get a default.
  return {
    ...settings,
    oaQuestionCount: settings.oaQuestionCount ?? DEFAULT_OA_QUESTION_COUNT,
    timeLimits: { ...DEFAULT_TIME_LIMITS, ...settings.timeLimits },
  };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await set("settings", next);
  return next;
}

/** Finished sessions, newest first. */
export const loadHistory = () => get("history");

export async function addToHistory(session: Session): Promise<void> {
  const history = await loadHistory();
  await set(
    "history",
    [session, ...history.filter((s) => s.id !== session.id)].slice(0, HISTORY_LIMIT),
  );
}

export const clearHistory = () => set("history", []);

/** Calls `onChange` whenever the active session changes, from any context. Returns an unsubscribe. */
export function watchSession(onChange: (session: Session | null) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && "session" in changes)
      onChange((changes.session.newValue as Session | null | undefined) ?? null);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
