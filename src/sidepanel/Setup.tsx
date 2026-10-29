import { useEffect, useMemo, useState } from "react";
import { filterProblems, PROBLEMS, topicCounts } from "../background/picker";
import {
  DEFAULT_OA_QUESTION_COUNT,
  DEFAULT_TIME_LIMITS,
  DIFFICULTIES,
  MAX_OA_QUESTION_COUNT,
} from "../shared/constants";
import { send } from "../shared/messages";
import { loadSettings, updateSettings } from "../shared/storage";
import type { Difficulty, Mode, SessionConfig, TimeLimits } from "../shared/types";
import TopicPicker from "./TopicPicker";

const TOPICS = topicCounts(PROBLEMS);

export default function Setup() {
  const [mode, setMode] = useState<Mode>("practice");
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [timeLimits, setTimeLimits] = useState<TimeLimits>(DEFAULT_TIME_LIMITS);
  const [questionCount, setQuestionCount] = useState(DEFAULT_OA_QUESTION_COUNT);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Restore the last setup and saved time limits.
  useEffect(() => {
    loadSettings().then(({ timeLimits, oaQuestionCount, lastConfig }) => {
      setTimeLimits(timeLimits);
      setQuestionCount(oaQuestionCount);
      if (lastConfig) {
        setMode(lastConfig.mode);
        setTopics(lastConfig.topics);
        setDifficulties(lastConfig.difficulties);
      }
    });
  }, []);

  const matching = useMemo(
    () => filterProblems(PROBLEMS, { topics, difficulties }).length,
    [topics, difficulties],
  );

  const toggleDifficulty = (d: Difficulty) =>
    setDifficulties((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));

  const setLimit = (d: Difficulty, minutes: number) => {
    const next = { ...timeLimits, [d]: minutes };
    setTimeLimits(next);
    updateSettings({ timeLimits: next });
  };

  const changeQuestionCount = (count: number) => {
    setQuestionCount(count);
    updateSettings({ oaQuestionCount: count });
  };

  async function start() {
    const config: SessionConfig =
      mode === "oa"
        ? { mode, topics, difficulties, questionCount, timeLimits }
        : { mode, topics, difficulties };
    setStarting(true);
    setError(null);
    try {
      await updateSettings({ lastConfig: config });
      await send("START_SESSION", config);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setStarting(false);
    }
  }

  return (
    <form
      className="setup"
      onSubmit={(e) => {
        e.preventDefault();
        start();
      }}
    >
      <section>
        <div className="segmented" role="radiogroup">
          {(["practice", "oa"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={mode === m ? "on" : ""}
              onClick={() => setMode(m)}
            >
              {m === "practice" ? "Practice mode" : "OA mode"}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="chips">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`chip ${d.toLowerCase()} ${difficulties.includes(d) ? "on" : ""}`}
              aria-pressed={difficulties.includes(d)}
              onClick={() => toggleDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section>
        <TopicPicker topics={TOPICS} selected={topics} onChange={setTopics} />
      </section>

      {mode === "oa" && (
        <details className="advanced">
          <summary>Advanced</summary>
          <label className="limit">
            <span>Questions</span>
            <input
              type="number"
              min={1}
              max={MAX_OA_QUESTION_COUNT}
              value={questionCount}
              onChange={(e) =>
                changeQuestionCount(
                  Math.min(MAX_OA_QUESTION_COUNT, Math.max(1, Number(e.target.value) || 1)),
                )
              }
            />
            <span />
          </label>
          <p className="muted hint">Time per question</p>
          {DIFFICULTIES.map((d) => (
            <label key={d} className="limit">
              <span>{d}</span>
              <input
                type="number"
                min={1}
                max={180}
                value={timeLimits[d]}
                onChange={(e) => setLimit(d, Math.max(1, Number(e.target.value) || 1))}
              />
              <span className="muted">min</span>
            </label>
          ))}
        </details>
      )}

      <footer>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={starting || matching === 0}>
          {starting ? "Starting…" : "Start"}
        </button>
      </footer>
    </form>
  );
}
