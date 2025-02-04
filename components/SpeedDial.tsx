import { useEffect, useState } from "react";
import { storage } from "wxt/storage";

export default function HomePage() {
  const [topSites, setTopSites] = useState<{ title: string; url: string }[]>(
    []
  );
  const [customShortcuts, setCustomShortcuts] = useState<
    { title: string; url: string }[]
  >([]);
  const [newShortcutUrl, setNewShortcutUrl] = useState("");

  // Fetch top sites from the background script
  useEffect(() => {
    const fetchTopSites = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          action: "fetchTopSites",
        });
        setTopSites(response.topSites || []);
      } catch (error) {
        console.error("Failed to fetch top sites:", error);
      }
    };

    fetchTopSites();
  }, []);

  // Load custom shortcuts from storage
  useEffect(() => {
    const loadCustomShortcuts = async () => {
      const shortcuts = await storage.getItem<{ title: string; url: string }[]>(
        "customShortcuts"
      );
      setCustomShortcuts(shortcuts || []);
    };

    loadCustomShortcuts();
  }, []);

  // Save custom shortcuts to storage
  const saveCustomShortcuts = async (
    shortcuts: { title: string; url: string }[]
  ) => {
    await storage.setItem("customShortcuts", shortcuts);
    setCustomShortcuts(shortcuts);
  };

  // Add a new shortcut
  const addShortcut = () => {
    if (!newShortcutUrl.trim()) return;

    try {
      const url = new URL(newShortcutUrl);
      const newShortcut = { title: url.hostname, url: url.href };
      const updatedShortcuts = [...customShortcuts, newShortcut];
      saveCustomShortcuts(updatedShortcuts);
      setNewShortcutUrl("");
    } catch (error) {
      console.error("Invalid URL:", error);
    }
  };

  return (
    <div className="p-4">
      {/* Most Visited Sites */}
      <div>
        <h2 className="text-lg font-bold mb-2">Most Visited</h2>
        <div className="flex gap-4 overflow-x-auto">
          {topSites.map((site, index) => (
            <a
              key={index}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-gray-200 p-3 flex-shrink-0 text-center"
              style={{ minWidth: "80px" }}
            >
              {site.title || "Untitled"}
            </a>
          ))}
        </div>
      </div>

      {/* Custom Shortcuts */}
      <div className="mt-6">
        <h2 className="text-lg font-bold mb-2">Custom Shortcuts</h2>
        <div className="flex gap-4 overflow-x-auto">
          {customShortcuts.map((shortcut, index) => (
            <a
              key={index}
              href={shortcut.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-blue-200 p-3 flex-shrink-0 text-center"
              style={{ minWidth: "80px" }}
            >
              {shortcut.title}
            </a>
          ))}
        </div>

        {/* Add Shortcut Input */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter URL"
            value={newShortcutUrl}
            onChange={(e) => setNewShortcutUrl(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button
            onClick={addShortcut}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
