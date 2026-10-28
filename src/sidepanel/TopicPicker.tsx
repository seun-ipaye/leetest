import { useMemo, useState } from "react";

interface Props {
  topics: { topic: string; count: number }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

/** Topics shown before the user searches or expands. */
const COLLAPSED_COUNT = 16;

export default function TopicPicker({ topics, selected, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? topics.filter((t) => t.topic.toLowerCase().includes(q)) : topics;
    return q || expanded ? matches : matches.slice(0, COLLAPSED_COUNT);
  }, [topics, query, expanded]);

  const toggle = (topic: string) =>
    onChange(selected.includes(topic) ? selected.filter((t) => t !== topic) : [...selected, topic]);

  return (
    <div className="topics">
      <input
        type="search"
        placeholder="Search topics"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chips">
        {visible.map(({ topic, count }) => (
          <button
            key={topic}
            type="button"
            className={`chip ${selected.includes(topic) ? "on" : ""}`}
            aria-pressed={selected.includes(topic)}
            onClick={() => toggle(topic)}
          >
            {topic} <span className="muted">{count}</span>
          </button>
        ))}
        {visible.length === 0 && <span className="muted">No topics match “{query}”.</span>}
      </div>
      <div className="row">
        {!query && topics.length > COLLAPSED_COUNT && (
          <button type="button" className="link" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show fewer" : `Show all ${topics.length}`}
          </button>
        )}
        {selected.length > 0 && (
          <button type="button" className="link" onClick={() => onChange([])}>
            Clear ({selected.length})
          </button>
        )}
      </div>
    </div>
  );
}
