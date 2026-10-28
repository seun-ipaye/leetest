import { send } from "../shared/messages";
import Setup from "./Setup";
import { useSession } from "./useSession";

export default function App() {
  const session = useSession();

  return (
    <main>
      <h1>LeetTest</h1>
      {session === undefined ? null : session?.status === "active" ? (
        // Active and results screens come next; placeholders keep the flow usable.
        <section>
          <p>
            Session in progress: question {session.index + 1}
            {session.config.mode === "oa" ? ` of ${session.queue.length}` : ""}.
          </p>
          <button className="primary" onClick={() => send("END_SESSION")}>
            End session
          </button>
        </section>
      ) : (
        <Setup />
      )}
    </main>
  );
}
