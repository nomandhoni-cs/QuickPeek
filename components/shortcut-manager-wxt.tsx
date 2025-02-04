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
import { Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
// import { toast } from "@/components/ui/use-toast";
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

export default function ShortcutManager() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
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
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedUrl = new URL(url);
      const mainDomain = parsedUrl.hostname.replace(/^www\./, "").split(".")[0];
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.protocol}//${parsedUrl.hostname}&sz=64`;

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
          toast({
            title: "Error",
            description: "This URL is already saved!",
            variant: "destructive",
          });
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
      toast({
        title: "Success",
        description:
          editingIndex !== null
            ? "Shortcut updated successfully!"
            : "Shortcut added successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
    }
  };

  const deleteShortcut = async (index: number) => {
    const updatedShortcuts = shortcuts.filter((_, i) => i !== index);
    await shortcutsStorage.setValue(updatedShortcuts);
    toast({
      title: "Success",
      description: "Shortcut deleted successfully!",
    });
  };

  const editShortcut = (index: number) => {
    const shortcut = shortcuts[index];
    setUrl(shortcut.url);
    setTitle(shortcut.title);
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-wrap gap-4 mx-auto max-w-screen-lg">
      {shortcuts.map((shortcut, index) => (
        <div
          key={index}
          className="group relative flex flex-col items-center justify-center w-20 h-20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-0 right-0 h-6 w-6 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => editShortcut(index)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => deleteShortcut(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => window.open(shortcut.url, "_blank")}
            className="flex flex-col items-center p-2 w-full h-full"
          >
            <img
              src={shortcut.favicon || "/placeholder.svg"}
              alt={shortcut.title}
              className="w-8 h-8 rounded mb-1"
            />
            <span className="text-xs text-center line-clamp-2">
              {toTitleCase(shortcut.title)}
            </span>
          </button>
        </div>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="w-20 h-20 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex flex-col items-center justify-center gap-1"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">Add shortcut</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit shortcut" : "Add shortcut"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                type="url"
                placeholder="Enter URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
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
