import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "LeetTest",
  version: pkg.version,
  description: "Randomized, timed LeetCode practice and OA simulation.",
  permissions: ["sidePanel", "storage", "tabs", "alarms", "webRequest"],
  host_permissions: ["https://leetcode.com/*"],
  background: { service_worker: "src/background/service-worker.ts", type: "module" },
  side_panel: { default_path: "src/sidepanel/index.html" },
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },
  action: {
    default_title: "Open LeetTest",
    default_icon: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
      48: "icons/icon-48.png",
      128: "icons/icon-128.png",
    },
  },
});
