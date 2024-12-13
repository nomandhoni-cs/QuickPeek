import { createRoot } from "react-dom/client";
import "./style.css";
import { ContentScriptContext } from "wxt/client";
import SpotlightSearch from "../components/SpotlightSearch";

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",

  main(ctx) {
    // Create a global event listener for CTRL+M
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "m") {
        event.preventDefault();
        mountSpotlightSearch(ctx);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup listener when context is invalidated
    // ctx.onInvalidate(() => {
    //   window.removeEventListener("keydown", handleKeyDown);
    // });
  },
});

async function mountSpotlightSearch(ctx: ContentScriptContext) {
  const ui = await createShadowRootUi(ctx, {
    name: "spotlight-search",
    position: "inline",
    anchor: "body",
    isolateEvents: true,
    onMount(container) {
      const root = createRoot(container);
      root.render(<SpotlightSearch onClose={() => ui.remove()} />);
    },
  });

  ui.mount();
}
