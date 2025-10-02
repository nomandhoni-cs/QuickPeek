// App.tsx
import { useEffect, useState } from "react";
import ShortcutManager from "@/components/ShortcutManager";
import ChromeTopSites from "@/components/ChromeTopSites";
import SearchInterface from "@/components/SearchInterface";
import {
  wallpaperItem,
  ensureInitialWallpaper,
} from "@/lib/wallpapers";
import { motion } from "framer-motion";

const App = () => {
  const [background, setBackground] = useState<string | null>(null);
  const [bgReady, setBgReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        await ensureInitialWallpaper();
        const saved = await wallpaperItem.getValue();
        setBackground(saved);
      } catch (err) {
        console.error("Failed to set up wallpaper:", err);
      }
    };

    setup();

    const unwatch = wallpaperItem.watch((newValue) => {
      setBgReady(false);
      setBackground(newValue);
    });

    return () => unwatch();
  }, []);

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
    <div className="h-screen flex items-center justify-center relative">
      {/* Full-screen background layer */}
      <div
        className="fixed inset-0 -z-10 transition-opacity duration-700"
        style={{
          backgroundImage: background ? `url(${background})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: bgReady ? 1 : 0,
          willChange: "opacity",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Content with smooth fade-in */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full  px-4"
      >
        <SearchInterface />
        <ChromeTopSites />
        <ShortcutManager />
      </motion.div>
    </div>
  );
};

export default App;