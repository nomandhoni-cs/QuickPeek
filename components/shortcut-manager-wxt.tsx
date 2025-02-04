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

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2 max-w-screen-lg mx-auto">
      {shortcuts.map((shortcut, index) => (
        <div
          key={index}
          className="group relative flex flex-col items-center justify-between h-28 px-2 py-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
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

          <a
            href={shortcut.url}
            className="flex flex-col items-center justify-between h-full w-full"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 p-2 flex items-center justify-center">
              <img
                src={shortcut.favicon || "/placeholder.svg"}
                alt={shortcut.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = "/placeholder.svg";
                }}
              />
            </div>
            <span className="text-sm font-medium text-center line-clamp-2 mt-2">
              {toTitleCase(shortcut.title)}
            </span>
          </a>
        </div>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className="flex items-center justify-center h-28">
            <Button
              variant="ghost"
              className="w-full h-full rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex flex-col items-center justify-center gap-2"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">Add shortcut</span>
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit shortcut" : "Add shortcut"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <div>
                <Input
                  type="url"
                  placeholder="Enter URL (e.g., https://example.com)"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  className={error ? "border-red-500" : ""}
                />
                {error && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              <Input
                type="text"
                placeholder="Enter title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Button onClick={handleSubmit}>
                {editingIndex !== null ? "Save changes" : "Add shortcut"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
