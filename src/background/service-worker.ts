import { problemUrl } from "../shared/constants";
import type { Reply, Request, RequestMap } from "../shared/messages";
import { addToHistory, loadSession, saveSession } from "../shared/storage";
import type { Session } from "../shared/types";
import { PROBLEMS } from "./picker";
import {
  advance,
  createSession,
  currentProblem,
  endSession,
  outcomeFromSubmissions,
} from "./session";

// Toolbar icon opens the side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

chrome.runtime.onMessage.addListener((msg: Request, _sender, sendResponse) => {
  serialize(() => handle(msg))
    .then((data): Reply<unknown> => ({ ok: true, data }))
    .catch((err: unknown): Reply<unknown> => {
      console.error(`[LeetTest] ${msg.type} failed:`, err);
      return { ok: false, error: String((err as Error)?.message ?? err) };
    })
    .then(sendResponse);
  return true; // respond asynchronously
});

// Handle one message at a time so read-modify-write on the session never interleaves.
let queue: Promise<unknown> = Promise.resolve();
function serialize<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

async function handle(msg: Request): Promise<RequestMap[Request["type"]]["response"]> {
  switch (msg.type) {
    case "START_SESSION": {
      const tab = await targetTab();
      const session = createSession(msg.payload, tab, PROBLEMS, Date.now());
      return commit(session);
    }
    case "NEXT_PROBLEM": {
      const session = await requireActive();
      return commit(advance(session, outcomeFromSubmissions(session), PROBLEMS, Date.now()));
    }
    case "SKIP_PROBLEM":
      return commit(advance(await requireActive(), "skipped", PROBLEMS, Date.now()));
    case "END_SESSION":
      return commit(endSession(await requireActive(), Date.now()));
    case "GET_SESSION":
      return loadSession();
    case "SUBMISSION": {
      // Recorded only for now; mode rules (auto-advance, unlock Next) come later.
      const session = await loadSession();
      const problem = session && currentProblem(session);
      if (!session || !problem || problem.slug !== msg.payload.slug) return session;
      const submission = { ...msg.payload, submittedAt: Date.now() };
      return saveSession({
        ...session,
        currentSubmissions: [...session.currentSubmissions, submission],
      }).then(loadSession);
    }
  }
}

/** Saves the session, archives it if finished, and points the tab at the current problem. */
async function commit(session: Session): Promise<Session> {
  const previous = await loadSession();
  await saveSession(session);
  if (session.status === "finished") await addToHistory(session);

  const problem = currentProblem(session);
  const moved = previous?.id !== session.id || previous.index !== session.index;
  if (problem && moved) await openInTab(session.tabId, problem.slug);
  return session;
}

async function requireActive(): Promise<Session> {
  const session = await loadSession();
  if (!session || session.status !== "active") throw new Error("No active session.");
  return session;
}

/**
 * The tab the user is looking at; the side panel has no tab of its own.
 * Only normal windows count, so a focused DevTools or popup window is ignored.
 */
async function targetTab(): Promise<number> {
  const win = await chrome.windows.getLastFocused({ windowTypes: ["normal"] }).catch(() => null);
  const [tab] =
    win?.id !== undefined ? await chrome.tabs.query({ active: true, windowId: win.id }) : [];
  if (tab?.id !== undefined) return tab.id;
  return (await chrome.tabs.create({ active: true })).id!;
}

/** Navigates the session's tab, reopening it if the user closed it. */
async function openInTab(tabId: number, slug: string): Promise<void> {
  try {
    await chrome.tabs.update(tabId, { url: problemUrl(slug), active: true });
  } catch {
    const tab = await chrome.tabs.create({ url: problemUrl(slug), active: true });
    const session = await loadSession();
    if (session && tab.id !== undefined) await saveSession({ ...session, tabId: tab.id });
  }
}
