import type { Session, SessionConfig } from "./types";

/**
 * Requests sent to the service worker, keyed by type, with the response each one gets.
 * Sent by the side panel. Submissions are picked up by the service worker itself.
 * To react to session changes, use watchSession() from storage.ts.
 */
export interface RequestMap {
  START_SESSION: { payload: SessionConfig; response: Session };
  NEXT_PROBLEM: { payload: undefined; response: Session };
  SKIP_PROBLEM: { payload: undefined; response: Session };
  END_SESSION: { payload: undefined; response: Session };
  GET_SESSION: { payload: undefined; response: Session | null };
}

export type RequestType = keyof RequestMap;

export type Request = {
  [K in RequestType]: { type: K; payload: RequestMap[K]["payload"] };
}[RequestType];

/** What actually crosses the wire, so errors reach the sender instead of vanishing. */
export type Reply<T> = { ok: true; data: T } | { ok: false; error: string };

export async function send<K extends RequestType>(
  type: K,
  ...[payload]: RequestMap[K]["payload"] extends undefined ? [] : [RequestMap[K]["payload"]]
): Promise<RequestMap[K]["response"]> {
  const reply: Reply<RequestMap[K]["response"]> = await chrome.runtime.sendMessage({
    type,
    payload,
  });
  if (!reply.ok) throw new Error(reply.error);
  return reply.data;
}
