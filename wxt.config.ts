import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "QuickPeek - Spotlight & Alfred like Search but for Browsers",
    description: "Spotlight and Alfred like Search for Browsers",
    permissions: ["history", "bookmarks", "tabs", "downloads"],
    host_permissions: ["<all_urls>"],
  },
});
