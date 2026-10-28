// Runs on leetcode.com/problems/*. Watches for a submission verdict and reports it.
// TODO: observe the result panel (MutationObserver) for "Accepted" / "Wrong Answer" / etc.
// TODO: chrome.runtime.sendMessage({ type: "SUBMISSION_RESULT", payload: { slug, status, runtime, memory } })
const slug = location.pathname.split("/")[2];
