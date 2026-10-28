// Filters the bundled problem bank and returns a random selection.
export async function pickProblems({ topics, difficulties, count }) {
  const res = await fetch(chrome.runtime.getURL("data/problems.json"));
  const all = await res.json();
  // TODO: filter by topic tag + difficulty, exclude paid-only, shuffle, take `count`
  return [];
}
