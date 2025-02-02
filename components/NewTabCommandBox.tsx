import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FileText,
  Mail,
  UserCircle2,
  CheckSquare,
  Moon,
  Sun,
  Bookmark,
  Clock,
  Download,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface CommandItemData {
  id: string;
  label: string;
  icon: React.ReactNode;
  metadata?: string;
  tabId: string;
  group?: string;
}

export default function NewTabCommandBox() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("recents");
  const [isOpen, setIsOpen] = useState(true);
  const [items, setItems] = useState<CommandItemData[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  // Demo data
  const demoData: CommandItemData[] = [
    // Recents (shows mixed recent items)
    {
      id: "1",
      label: "Draft an email",
      icon: <Mail className="mr-2 h-4 w-4 text-blue-400" />,
      metadata: "Action",
      tabId: "recents",
      group: "Actions",
    },
    {
      id: "2",
      label: "mydoc.pdf",
      icon: <FileText className="mr-2 h-4 w-4 text-purple-400" />,
      metadata: "4564 KB",
      tabId: "recents",
      group: "Documents",
    },
    // Tabs
    {
      id: "3",
      label: "Project Dashboard",
      icon: <FileText className="mr-2 h-4 w-4 text-green-400" />,
      metadata: "chrome-extension://...",
      tabId: "tabs",
    },
    // Bookmarks
    {
      id: "4",
      label: "Important Docs",
      icon: <Bookmark className="mr-2 h-4 w-4 text-red-400" />,
      metadata: "https://company.com/docs",
      tabId: "bookmarks",
    },
    // History
    {
      id: "5",
      label: "Visited Today",
      icon: <Clock className="mr-2 h-4 w-4 text-yellow-400" />,
      metadata: "https://github.com",
      tabId: "history",
    },
    // Downloads
    {
      id: "6",
      label: "report.pdf",
      icon: <Download className="mr-2 h-4 w-4 text-blue-400" />,
      metadata: "Downloaded 2h ago",
      tabId: "downloads",
    },
  ];

  const tabs: TabConfig[] = [
    { id: "recents", label: "Recents" },
    { id: "tabs", label: "Tabs" },
    { id: "bookmarks", label: "Bookmarks" },
    { id: "history", label: "History" },
    { id: "downloads", label: "Downloads" },
  ];

  // Group items by their group property
  const groupedItems = items.reduce((acc, item) => {
    const group = item.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, CommandItemData[]>);

  useEffect(() => {
    // Simulate data fetching based on active tab
    const fetchData = () => {
      // In real implementation, you'd fetch from API here
      const filteredData =
        activeTab === "recents"
          ? demoData
          : demoData.filter((item) => item.tabId === activeTab);

      setItems(filteredData);
    };

    fetchData();
  }, [activeTab]);

  // Tab functions - will be executed when tab changes
  const tabFunctions = {
    recents: () => console.log("Recents tab activated"),
    tabs: () => console.log("Tabs tab activated"),
    bookmarks: () => console.log("Bookmarks tab activated"),
    history: () => console.log("History tab activated"),
    downloads: () => console.log("Downloads tab activated"),
  };

  useEffect(() => {
    setMounted(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", down as any);
    return () => document.removeEventListener("keydown", down as any);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
      const newIndex =
        e.key === "ArrowLeft"
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length;

      const newTab = tabs[newIndex].id;
      setActiveTab(newTab);
      handleTabChange(newTab);
    }
  };

  const handleTabChange = (tabId: string) => {
    const tabFunction = tabFunctions[tabId as keyof typeof tabFunctions];
    if (tabFunction) {
      tabFunction();
    }
  };

  if (!mounted) return null;

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gradient dark:bg-dark-gradient">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 w-full h-full bg-gradient-animated dark:bg-dark-gradient-animated" />
      </div>

      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full bg-background/30 backdrop-blur-sm"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="relative h-full w-full flex items-start justify-center px-4 pt-32 rounded-lg">
        {isOpen && (
          <div
            className="w-full max-w-[800px] animate-in fade-in-0 slide-in-from-top-4 duration-200 relative rounded-xl"
            ref={commandRef}
          >
            <Command
              className="rounded-lg border-0 shadow-2xl glassmorphism overflow-hidden flex flex-col"
              onKeyDown={handleKeyDown}
            >
              <div className="flex flex-col flex-none">
                <div className="border-b border-border/20">
                  <CommandInput
                    ref={inputRef}
                    placeholder="Search for anything, documents, actions, contacts..."
                    className="w-full"
                  />
                </div>
                <div className="border-b border-border/20">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                      setActiveTab(value);
                      handleTabChange(value);
                    }}
                    className="w-full"
                  >
                    <TabsList className="w-full justify-start h-12 bg-transparent">
                      {tabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="data-[state=active]:bg-accent/30"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>

                  {Object.entries(groupedItems).map(
                    ([groupName, groupItems]) => (
                      <CommandGroup key={groupName} heading={groupName}>
                        {groupItems.map((item) => (
                          <CommandItem key={item.id}>
                            {item.icon}
                            <span>{item.label}</span>
                            {item.metadata && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                {item.metadata}
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )
                  )}
                </CommandList>
              </div>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
}
