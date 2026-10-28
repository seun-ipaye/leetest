import { useEffect, useState } from "react";
import { slugFromUrl } from "../background/submissions";

export type TabStatus = "on-problem" | "elsewhere" | "closed";

/** Whether the session's tab is still open and showing `slug`. Submissions only count there. */
export function useTabStatus(tabId: number, slug: string): TabStatus {
  const [status, setStatus] = useState<TabStatus>("on-problem");

  useEffect(() => {
    const check = () =>
      chrome.tabs
        .get(tabId)
        .then((tab) => setStatus(slugFromUrl(tab.url) === slug ? "on-problem" : "elsewhere"))
        .catch(() => setStatus("closed"));

    const onUpdated = (id: number) => id === tabId && check();
    const onRemoved = (id: number) => id === tabId && setStatus("closed");
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
    check();
    return () => {
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.tabs.onRemoved.removeListener(onRemoved);
    };
  }, [tabId, slug]);

  return status;
}
