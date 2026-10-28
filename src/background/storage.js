// Session state lives in chrome.storage so it survives service worker restarts.
export const loadSession = async () => (await chrome.storage.local.get("session")).session ?? null;
export const saveSession = (session) => chrome.storage.local.set({ session });
export const clearSession = () => chrome.storage.local.remove("session");
