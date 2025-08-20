import { useEffect, useState } from "react";
import ShortcutManager from "@/components/shortcut-manager-wxt";
import ChromeTopSites from "@/components/ChromeTopSites";
import SearchInterface from "@/components/SearchInterface";
import {
  wallpaperItem,
  ensureInitialWallpaper,
} from "@/lib/wallpapers";

const App = () => {
  const [background, setBackground] = useState<string | null>(null);
  const [bgReady, setBgReady] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Ensure first-time users get a random wallpaper
    const setup = async () => {
      try {
        await ensureInitialWallpaper();
        const saved = await wallpaperItem.getValue();
        setBackground(saved);
      } catch (err) {
        console.error("Failed to set up wallpaper:", err);
      } finally {
        setInitialLoading(false);
      }
    };

    setup();

    const unwatch = wallpaperItem.watch((newValue) => {
      setBgReady(false);
      setBackground(newValue);
    });

    return () => unwatch();
  }, []);

  // Decode before showing to avoid pop-in
  useEffect(() => {
    if (!background) {
      setBgReady(true);
      return;
    }

    const img = new Image();
    img.src = background;

    const decodePromise = img.decode?.() ?? Promise.resolve();
    decodePromise
      .then(() => setBgReady(true))
      .catch(() => {
        console.error("Failed to decode image");
        setBgReady(true);
      });
  }, [background]);

  return (
    <div className="h-screen flex items-center justify-center">
      {/* Initial loading indicator */}
      {initialLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
            <p className="text-sm text-muted-foreground">Setting up your new tab...</p>
          </div>
        </div>
      )}

      {/* Full-screen background layer */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-500"
        style={{
          backgroundImage: background ? `url(${background})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: bgReady ? 1 : 0,
          willChange: "opacity, background-image",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Your existing content */}
      <div>
        <SearchInterface />
        <ChromeTopSites />
        <ShortcutManager />
      </div>
    </div>
  );
};

export default App;