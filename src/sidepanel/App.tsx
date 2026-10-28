import { useState } from "react";
import { clearSession } from "../shared/storage";
import Active from "./Active";
import History from "./History";
import Results from "./Results";
import Setup from "./Setup";
import { useSession } from "./useSession";

export default function App() {
  const session = useSession();
  const [showHistory, setShowHistory] = useState(false);

  let content: React.ReactNode;
  if (session === undefined) {
    content = null;
  } else if (session?.status === "active") {
    content = <Active session={session} />;
  } else if (showHistory) {
    content = <History onBack={() => setShowHistory(false)} />;
  } else if (session?.status === "finished") {
    content = (
      <Results
        session={session}
        actions={
          <>
            <button className="primary" onClick={() => clearSession()}>
              New session
            </button>
            <button className="secondary" onClick={() => setShowHistory(true)}>
              History
            </button>
          </>
        }
      />
    );
  } else {
    content = <Setup />;
  }

  return (
    <main>
      <header className="app-header">
        <h1>LeetTest</h1>
        {session?.status !== "active" && !showHistory && session?.status !== "finished" && (
          <button className="link" onClick={() => setShowHistory(true)}>
            History
          </button>
        )}
      </header>
      {content}
    </main>
  );
}
