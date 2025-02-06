import React, { useState, useEffect } from "react";
import { storage } from "wxt/storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

interface Shortcut {
  url: string;
  favicon: string;
  title: string;
}

const shortcutsStorage = storage.defineItem<Shortcut[]>("local:shortcuts", {
  fallback: [],
  version: 1,
});

const topSitesHiddenStorage = storage.defineItem<boolean>(
  "local:topSitesHidden",
  {
    fallback: false,
    version: 1,
  }
);

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function ChromeTopSites() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [topSites, setTopSites] = useState<Shortcut[]>([]);
  const [displayShortcuts, setDisplayShortcuts] = useState<Shortcut[]>([]);
  const [showTopSites, setShowTopSites] = useState<boolean>(false);
  //   const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      const topSitesHidden = await topSitesHiddenStorage.getValue();
      setShowTopSites(!topSitesHidden);

      if (!topSitesHidden) {
        fetchTopSites();
      } else {
        setDisplayShortcuts(shortcuts);
      }
    };

    loadInitialData();

    const watchShortcuts = shortcutsStorage.watch((newShortcuts) => {
      setShortcuts(newShortcuts);
    });

    const unwatchTopSitesHidden = topSitesHiddenStorage.watch((hidden) => {
      setShowTopSites(!hidden); // Update showTopSites state when storage changes
      if (!hidden) {
        fetchTopSites(); // Refetch top sites if they become visible
      } else {
        setDisplayShortcuts(shortcuts); // Switch to custom shortcuts if top sites hidden
      }
    });

    return () => {
      watchShortcuts();
      unwatchTopSitesHidden(); // Cleanup watcher
    };
  }, [shortcuts]); // Removed showTopSites from dependency array, as watcher handles updates

  useEffect(() => {
    if (showTopSites) {
      setDisplayShortcuts(topSites);
    } else {
      setDisplayShortcuts(shortcuts);
    }
  }, [showTopSites, shortcuts, topSites]); // Still need this effect to update displayShortcuts

  const fetchTopSites = () => {
    if (browser?.topSites?.get) {
      browser.topSites.get((topSitesData) => {
        const formattedTopSites: Shortcut[] = topSitesData
          .slice(0, 9)
          .map((site) => {
            const parsedUrl = new URL(site.url);
            const mainDomain = parsedUrl.hostname
              .replace(/^www\./, "")
              .split(".")[0];
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.protocol}//${parsedUrl.hostname}&sz=128`;
            return {
              url: site.url,
              favicon: faviconUrl,
              title: toTitleCase(site.title || mainDomain),
            };
          });
        setTopSites(formattedTopSites);
      });
    }
  };

  const deleteShortcut = async (index: number) => {
    const updatedShortcuts = shortcuts.filter((_, i) => i !== index);
    await shortcutsStorage.setValue(updatedShortcuts);
  };

  const editShortcut = (index: number) => {
    // You can implement edit functionality if needed, maybe using a modal
    console.log("Edit shortcut at index:", index);
    // setEditingIndex(index);
    // setIsDialogOpen(true); // If you have a dialog for editing
  };

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 max-w-screen-lg mx-auto">
      {displayShortcuts.map((shortcut, index) => (
        <div
          key={index}
          className="group relative flex flex-col items-center justify-between h-28 px-2 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          {!showTopSites && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => editShortcut(index)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteShortcut(index)}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <a
            href={shortcut.url}
            className="flex flex-col items-center justify-between h-full w-full"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 p-2 flex items-center justify-center">
              <img
                src={shortcut.favicon || "/placeholder.svg"}
                alt={shortcut.title}
                className="w-full h-full rounded-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/placeholder.svg";
                  img.onerror = null;
                  img.src = "/placeholder.svg";
                }}
              />
            </div>
            <span className="text-sm font-medium text-center line-clamp-2 mt-2">
              {shortcut.title?.slice(0, 10) || ""}
            </span>
          </a>
        </div>
      ))}
    </div>
  );
}
