import type { Session, SessionConfig, Submission } from "./types";

/**
 * Requests sent to the service worker, keyed by type, with the response each one gets.
 * Senders: side panel (session control) and content script (submissions).
 */
export interface RequestMap {
  START_SESSION: { payload: SessionConfig; response: Session };
  NEXT_PROBLEM: { payload: undefined; response: Session };
  SKIP_PROBLEM: { payload: undefined; response: Session };
  END_SESSION: { payload: undefined; response: Session };
  GET_SESSION: { payload: undefined; response: Session | null };
  SUBMISSION: { payload: Omit<Submission, "submittedAt">; response: void };
}

export type RequestType = keyof RequestMap;

export type Request = {
  [K in RequestType]: { type: K; payload: RequestMap[K]["payload"] };
}[RequestType];

/** Broadcast from the service worker whenever the session changes. */
export interface SessionUpdated {
  type: "SESSION_UPDATED";
  session: Session | null;
}

export function send<K extends RequestType>(
  type: K,
  ...[payload]: RequestMap[K]["payload"] extends undefined ? [] : [RequestMap[K]["payload"]]
): Promise<RequestMap[K]["response"]> {
  return chrome.runtime.sendMessage({ type, payload });
}
