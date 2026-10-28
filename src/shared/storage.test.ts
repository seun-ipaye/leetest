import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TIME_LIMITS } from "./constants";
import type { Session } from "./types";
import {
  addToHistory,
  clearSession,
  HISTORY_LIMIT,
  loadHistory,
  loadSession,
  loadSettings,
  saveSession,
  updateSettings,
  watchSession,
} from "./storage";

type Listener = (changes: Record<string, { newValue?: unknown }>, area: string) => void;

/** Minimal in-memory stand-in for chrome.storage.local + onChanged. */
function fakeChromeStorage() {
  const data: Record<string, unknown> = {};
  const listeners = new Set<Listener>();
  return {
    local: {
      get: async (key: string) => (key in data ? { [key]: data[key] } : {}),
      set: async (items: Record<string, unknown>) => {
        Object.assign(data, items);
        const changes = Object.fromEntries(
          Object.entries(items).map(([k, v]) => [k, { newValue: v }]),
        );
        listeners.forEach((l) => l(changes, "local"));
      },
    },
    onChanged: {
      addListener: (l: Listener) => listeners.add(l),
      removeListener: (l: Listener) => listeners.delete(l),
    },
  };
}

const session = (id: string): Session => ({
  id,
  config: { mode: "practice", topics: [], difficulties: [] },
  tabId: 1,
  status: "active",
  queue: [],
  index: 0,
  currentSubmissions: [],
  currentStartedAt: 0,
  results: [],
  startedAt: 0,
});

beforeEach(() => {
  vi.stubGlobal("chrome", { storage: fakeChromeStorage() });
});

describe("session", () => {
  it("is null until saved, and null again after clearing", async () => {
    expect(await loadSession()).toBeNull();
    await saveSession(session("a"));
    expect((await loadSession())?.id).toBe("a");
    await clearSession();
    expect(await loadSession()).toBeNull();
  });

  it("notifies watchers until unsubscribed", async () => {
    const seen: (string | null)[] = [];
    const stop = watchSession((s) => seen.push(s?.id ?? null));
    await saveSession(session("a"));
    await clearSession();
    stop();
    await saveSession(session("b"));
    expect(seen).toEqual(["a", null]);
  });
});

describe("settings", () => {
  it("defaults to 10/20/30 minute limits", async () => {
    expect((await loadSettings()).timeLimits).toEqual(DEFAULT_TIME_LIMITS);
  });

  it("persists custom limits", async () => {
    await updateSettings({ timeLimits: { Easy: 5, Medium: 15, Hard: 45 } });
    expect((await loadSettings()).timeLimits).toEqual({ Easy: 5, Medium: 15, Hard: 45 });
  });
});

describe("history", () => {
  it("keeps newest first, without duplicates", async () => {
    await addToHistory(session("a"));
    await addToHistory(session("b"));
    await addToHistory(session("a"));
    expect((await loadHistory()).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("caps at the history limit", async () => {
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) await addToHistory(session(String(i)));
    const history = await loadHistory();
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0].id).toBe(String(HISTORY_LIMIT + 4));
  });
});
