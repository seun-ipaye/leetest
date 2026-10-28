import { useState } from "react";
import { canGoNext, currentProblem, deadlineFor } from "../background/session";
import { send, type RequestType } from "../shared/messages";
import type { Session } from "../shared/types";
import { useNow } from "./useNow";
import { useTabStatus } from "./useTabStatus";

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function Active({ session }: { session: Session }) {
  const problem = currentProblem(session);
  const isOA = session.config.mode === "oa";
  const deadline = deadlineFor(session);
  const now = useNow(deadline !== null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tabStatus = useTabStatus(session.tabId, problem?.slug ?? "");

  if (!problem) return null;

  async function act(
    type: Extract<RequestType, "NEXT_PROBLEM" | "SKIP_PROBLEM" | "END_SESSION" | "REOPEN_PROBLEM">,
  ) {
    if (
      type === "END_SESSION" &&
      isOA &&
      !confirm("End the OA now? Unanswered questions count as skipped.")
    )
      return;
    setBusy(true);
    setError(null);
    try {
      await send(type);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const remaining = deadline !== null ? deadline - now : null;
  const solved = session.results.filter((r) => r.outcome === "accepted").length;
  const lastVerdict = session.currentSubmissions.at(-1);
  const nextUnlocked = canGoNext(session);

  return (
    <div className="active">
      <div className="progress">
        {isOA ? (
          <>
            <span>
              Question {session.index + 1} of {session.queue.length}
            </span>
            <span className="dots" aria-hidden>
              {session.queue.map((_, i) => (
                <span
                  key={i}
                  className={i < session.index ? "done" : i === session.index ? "now" : ""}
                />
              ))}
            </span>
          </>
        ) : (
          <span>
            Problem {session.index + 1} · {solved} solved
          </span>
        )}
      </div>

      {remaining !== null && (
        <div className={`clock ${remaining < 60_000 ? "low" : ""}`} role="timer">
          {remaining > 0 ? formatClock(remaining) : "Time's up"}
        </div>
      )}
      {remaining !== null && remaining <= 0 && (
        <p className="muted hint center">Moving to the next question…</p>
      )}

      {tabStatus !== "on-problem" && (
        <div className="banner">
          <span>
            {tabStatus === "closed"
              ? "The problem tab was closed."
              : "You've left this problem. Submissions only count on its page."}
          </span>
          <button className="link" onClick={() => act("REOPEN_PROBLEM")}>
            {tabStatus === "closed" ? "Reopen" : "Go back"}
          </button>
        </div>
      )}

      <div className="problem">
        <span className={`badge ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
        <h2 className="title">
          {problem.id}. {problem.title}
        </h2>
        {!isOA && <p className="muted tags">{problem.tags.join(" · ")}</p>}
        <button type="button" className="link" onClick={() => act("REOPEN_PROBLEM")}>
          Reopen problem
        </button>
      </div>

      {!isOA && (
        <div className="verdict">
          {lastVerdict ? (
            <p className={lastVerdict.verdict === "Accepted" ? "ok" : "error"}>
              {lastVerdict.verdict}
              {lastVerdict.runtime && <span className="muted"> · {lastVerdict.runtime}</span>}
              {lastVerdict.memory && <span className="muted"> · {lastVerdict.memory}</span>}
            </p>
          ) : (
            <p className="muted">Submit on LeetCode. Your verdict shows up here.</p>
          )}
          {session.currentSubmissions.length > 1 && (
            <p className="muted hint">{session.currentSubmissions.length} submissions</p>
          )}
        </div>
      )}

      {isOA && (
        <p className="muted hint">
          Submitting moves you to the next question. Results come at the end.
        </p>
      )}

      {error && <p className="error">{error}</p>}

      <div className="actions">
        {!isOA && (
          <button
            className="primary"
            disabled={busy || !nextUnlocked}
            title={nextUnlocked ? undefined : "Get Accepted to unlock"}
            onClick={() => act("NEXT_PROBLEM")}
          >
            Next
          </button>
        )}
        <button className="secondary" disabled={busy} onClick={() => act("SKIP_PROBLEM")}>
          Skip
        </button>
        <button className="secondary" disabled={busy} onClick={() => act("END_SESSION")}>
          End
        </button>
      </div>
      {!isOA && !nextUnlocked && <p className="muted hint">Get Accepted to unlock Next.</p>}
    </div>
  );
}
