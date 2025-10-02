import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Pencil, Trash2, AlertCircle } from "lucide-react";
import { storage } from "wxt/storage";

interface Shortcut {
  url: string;
  favicon: string;
  title: string;
}

const shortcutsStorage = storage.defineItem<Shortcut[]>("local:shortcuts", {
  fallback: [],
  version: 1,
});

function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function ShortcutManager() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const loadShortcuts = async () => {
      const savedShortcuts = await shortcutsStorage.getValue();
      setShortcuts(savedShortcuts);
    };

    loadShortcuts();

    const unwatch = shortcutsStorage.watch((newShortcuts) => {
      setShortcuts(newShortcuts);
    });

    return () => unwatch();
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!url) {
      setError("Please enter a URL");
      return;
    }

    if (!isValidUrl(url)) {
      setError(
        "Please enter a valid URL (must start with http:// or https://)"
      );
      return;
    }

    if (shortcuts.length >= 10 && editingIndex === null) {
      setError("Maximum 10 shortcuts allowed");
      return;
    }

    try {
      const parsedUrl = new URL(url);
      const mainDomain = parsedUrl.hostname.replace(/^www\./, "").split(".")[0];
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.protocol}//${parsedUrl.hostname}&sz=128`;

      if (editingIndex !== null) {
        const updatedShortcuts = [...shortcuts];
        updatedShortcuts[editingIndex] = {
          url,
          favicon: faviconUrl,
          title: toTitleCase(title || mainDomain),
        };
        await shortcutsStorage.setValue(updatedShortcuts);
      } else {
        if (shortcuts.some((s) => s.url === url)) {
          setError("This URL is already saved!");
          return;
        }

        const newShortcut: Shortcut = {
          url,
          favicon: faviconUrl,
          title: toTitleCase(title || mainDomain),
        };
        await shortcutsStorage.setValue([...shortcuts, newShortcut]);
      }

      setUrl("");
      setTitle("");
      setEditingIndex(null);
      setIsDialogOpen(false);
    } catch (error) {
      setError("An error occurred while saving the shortcut");
    }
  };

  const deleteShortcut = async (index: number) => {
    const updatedShortcuts = shortcuts.filter((_, i) => i !== index);
    await shortcutsStorage.setValue(updatedShortcuts);
  };

  const editShortcut = (index: number) => {
    const shortcut = shortcuts[index];
    setUrl(shortcut.url);
    setTitle(shortcut.title);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setUrl("");
      setTitle("");
      setError("");
      setEditingIndex(null);
    }
    setIsDialogOpen(open);
  };

  return (
    <div className="w-full mx-auto px-4">
      {/* Centered flex container with max 10 items */}
      <div className="flex flex-wrap justify-center gap-4">
        {shortcuts.slice(0, 10).map((shortcut, index) => (
          <div
            key={index}
            className="group relative flex flex-col items-center w-[100px]"
          >
            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 z-10"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => editShortcut(index)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => deleteShortcut(index)}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <a
              href={shortcut.url}
              className="flex flex-col items-center w-full group/link"
            >

              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 p-2.5 flex items-center justify-center">
                <img
                  src={shortcut.favicon || "/placeholder.svg"}
                  alt={shortcut.title}
                  className="w-full h-full rounded-full object-contain"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = "/placeholder.svg";
                    img.onerror = null;
                  }}
                />
              </div>

              {/* Title */}
              < span className="text-xs font-medium pt-2 text-gray-700 dark:text-gray-300 text-center line-clamp-2 w-full px-1 leading-tight" >
                {shortcut.title?.slice(0, 12) || ""}
              </span>
            </a>
          </div>
        ))}

        {/* Add shortcut button - only show if less than 10 shortcuts */}
        {shortcuts.length < 10 && (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <div className="flex flex-col items-center w-[100px]">
                <Button
                  variant="ghost"
                  className="w-14 h-14 mb-3 rounded-full bg-transparent border-2 border-dashed border-gray-300 hover:border-gray-400  hover:bg-gray-50/50 transition-all duration-200 p-0 flex items-center justify-center group/add"
                >
                  <Plus className="h-7 w-7 text-gray-400  group-hover/add:text-gray-600 transition-colors" />
                </Button>
                < span className="text-xs font-medium text-gray-700 text-center line-clamp-2 w-full px-1 leading-tight" >
                  Add shortcut
                </span>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[440px]">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingIndex !== null ? "Edit shortcut" : "Add shortcut"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError("");
                      }}
                      className={`h-11 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      autoFocus
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name (optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter a custom name"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-red-600 dark:text-red-400">
                        {error}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    className="flex-1 h-11"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1 h-11">
                    {editingIndex !== null ? "Save changes" : "Add shortcut"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}