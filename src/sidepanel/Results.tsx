import { problemUrl } from "../shared/constants";
import { formatDuration, OUTCOME_LABELS, resultDuration, sessionScore } from "../shared/stats";
import type { Session } from "../shared/types";

interface Props {
  session: Session;
  actions: React.ReactNode;
}

export default function Results({ session, actions }: Props) {
  const { accepted, total } = sessionScore(session);
  const isOA = session.config.mode === "oa";
  const elapsed = (session.endedAt ?? session.startedAt) - session.startedAt;

  return (
    <div className="results">
      <div className="score">
        <span className="big">
          {accepted}/{total}
        </span>
        <span className="muted">
          {isOA ? "OA" : "Practice"} · {formatDuration(elapsed)} ·{" "}
          {new Date(session.startedAt).toLocaleDateString()}
        </span>
      </div>

      <ol className="result-list">
        {session.results.map((r, i) => {
          const last = r.submissions.at(-1);
          return (
            <li key={`${r.problem.id}-${i}`} className={`result ${r.outcome}`}>
              <div className="result-head">
                <a href={problemUrl(r.problem.slug)} target="_blank" rel="noreferrer">
                  {r.problem.id}. {r.problem.title}
                </a>
                <span className={`badge ${r.problem.difficulty.toLowerCase()}`}>
                  {r.problem.difficulty}
                </span>
              </div>
              <div className="muted result-meta">
                <span className={`outcome ${r.outcome}`}>{OUTCOME_LABELS[r.outcome]}</span>
                {" · "}
                {formatDuration(resultDuration(r))}
                {r.submissions.length > 0 &&
                  ` · ${r.submissions.length} submission${r.submissions.length === 1 ? "" : "s"}`}
                {last && last.verdict !== "Accepted" && ` · last: ${last.verdict}`}
                {last?.verdict === "Accepted" && last.runtime && ` · ${last.runtime}`}
              </div>
            </li>
          );
        })}
        {session.results.length === 0 && <p className="muted">No problems attempted.</p>}
      </ol>

      <div className="actions">{actions}</div>
    </div>
  );
}
