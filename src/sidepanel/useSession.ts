import { useEffect, useState } from "react";
import { loadSession, watchSession } from "../shared/storage";
import type { Session } from "../shared/types";

/** The live session: `undefined` while loading, `null` when there isn't one. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const stop = watchSession(setSession);
    loadSession().then(setSession);
    return stop;
  }, []);
  return session;
}
