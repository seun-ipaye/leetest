import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "LeetTest",
  version: pkg.version,
  description: "Randomized, timed LeetCode practice and OA simulation.",
  permissions: ["sidePanel", "storage", "tabs", "alarms"],
  host_permissions: ["https://leetcode.com/*"],
  background: { service_worker: "src/background/service-worker.ts", type: "module" },
  side_panel: { default_path: "src/sidepanel/index.html" },
  action: { default_title: "Open LeetTest" },
});
