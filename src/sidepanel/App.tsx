import Active from "./Active";
import Setup from "./Setup";
import { useSession } from "./useSession";

export default function App() {
  const session = useSession();

  return (
    <main>
      <h1>LeetTest</h1>
      {session === undefined ? null : session?.status === "active" ? (
        <Active session={session} />
      ) : (
        // Results screen comes next.
        <Setup />
      )}
    </main>
  );
}
