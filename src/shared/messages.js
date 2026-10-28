// Message types shared by the side panel, service worker and content script.
export const MSG = {
  START_SESSION: "START_SESSION",   // panel -> sw  { topics, difficulties, count, timeLimits, oaMode }
  NEXT_PROBLEM: "NEXT_PROBLEM",     // panel -> sw
  END_SESSION: "END_SESSION",       // panel -> sw
  GET_STATE: "GET_STATE",           // panel -> sw
  STATE_UPDATED: "STATE_UPDATED",   // sw -> panel  { session }
  SUBMISSION_RESULT: "SUBMISSION_RESULT", // content -> sw { slug, status, runtime, memory }
};
