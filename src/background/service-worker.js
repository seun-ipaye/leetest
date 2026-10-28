import { MSG } from "../shared/messages.js";
import { pickProblems } from "./picker.js";
import { loadSession, saveSession, clearSession } from "./storage.js";

// Toolbar icon opens the side panel.
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handle(msg, sender).then(sendResponse);
  return true; // async response
});

async function handle(msg, sender) {
  switch (msg.type) {
    case MSG.START_SESSION:     return startSession(msg.payload);
    case MSG.NEXT_PROBLEM:      return advance();
    case MSG.END_SESSION:       return endSession();
    case MSG.GET_STATE:         return loadSession();
    case MSG.SUBMISSION_RESULT: return onSubmission(msg.payload);
  }
}

async function startSession(config) {
  // TODO: pickProblems(config) -> build session { config, queue, index, results, startedAt }
  // TODO: open queue[0] in the active tab, start alarm for its time limit
}

async function onSubmission(result) {
  // TODO: record result for current problem
  // TODO: if config.oaMode -> advance() automatically; else broadcast so panel shows result + Next
}

async function advance() {
  // TODO: index++, navigate tab to next slug, reset alarm; if done -> endSession()
}

async function endSession() {
  // TODO: finalize results, keep in history, broadcast STATE_UPDATED
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  // TODO: time's up for current problem -> mark "timed out", advance()
});

function goTo(tabId, slug) {
  return chrome.tabs.update(tabId, { url: `https://leetcode.com/problems/${slug}/` });
}
