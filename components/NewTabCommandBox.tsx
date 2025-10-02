import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleSearch } from "@/lib/searchUtils";

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

interface SearchItem {
  id: string | number;
  url: string;
  title: string;
  favIconUrl?: string;
  filename?: string;
  startTime?: number;
  state?: string;
  lastVisitTime?: number;
}

interface SearchResult {
  recent: SearchItem[];
  tabs: SearchItem[];
  history: SearchItem[];
  bookmarks: SearchItem[];
  downloads: SearchItem[];
}

// Add this interface to track last fetched terms
interface SectionCache {
  [key: string]: {
    lastTerm: string;
    data: SearchItem[];
  };
}

export default function NewTabCommandBox() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("recents");
  const [isOpen, setIsOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [sectionCache, setSectionCache] = useState<SectionCache>({});
  const [loading, setLoading] = useState(false);

  const tabs: TabConfig[] = [
    { id: "recents", label: "Recents" },
    { id: "tabs", label: "Tabs" },
    { id: "bookmarks", label: "Bookmarks" },
    { id: "history", label: "History" },
    { id: "downloads", label: "Downloads" },
  ];
  // Fetch results based on input
  const fetchResults = useCallback(
    async (searchTerm: string) => {
      if (searchTerm.length < 3) {
        setResults((prev) =>
          prev
            ? {
              ...prev,
              [activeTab]: [],
            }
            : {
              recent: [],
              tabs: [],
              history: [],
              bookmarks: [],
              downloads: [],
            }
        );
        return;
      }

      // Check cache before fetching
      if (sectionCache[activeTab]?.lastTerm === searchTerm) {
        setResults((prev) =>
          prev
            ? {
              ...prev,
              [activeTab]: sectionCache[activeTab].data,
            }
            : {
              recent: [],
              tabs: [],
              history: [],
              bookmarks: [],
              downloads: [],
              [activeTab]: sectionCache[activeTab].data,
            }
        );
        return;
      }

      setLoading(true);
      try {
        const response = await browser.runtime.sendMessage({
          action: "fetchSection",
          section: activeTab,
          searchTerm,
        });

        console.log(`Response for ${activeTab}:`, response); // Log the response

        if (response) {
          // Update cache
          setSectionCache((prev) => ({
            ...prev,
            [activeTab]: {
              lastTerm: searchTerm,
              data: response[activeTab],
            },
          }));

          setResults((prev) => ({
            ...prev,
            ...response,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch results:", error);
      } finally {
        setLoading(false);
      }
    },
    [activeTab, sectionCache]
  );

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

  const isValidUrl = useCallback((string: string): boolean => {
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(string.trim());
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmedValue = value.trim();
      if (isValidUrl(trimmedValue)) {
        const url = trimmedValue.includes("://")
          ? trimmedValue
          : `https://${trimmedValue}`;
        window.open(url, "_blank");
      } else {
        handleSearch(trimmedValue);
      }
    },
    [isValidUrl]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const sections: (keyof SearchResult)[] = [
      "recent",
      "tabs",
      "history",
      "bookmarks",
      "downloads",
    ];

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        // Move to the previous tab
        const prevIndex = tabs.findIndex((tab) => tab.id === activeTab);
        const newPrevTab = tabs[(prevIndex - 1 + tabs.length) % tabs.length].id;
        setActiveTab(newPrevTab);
        handleTabChange(newPrevTab);
        break;

      case "ArrowRight":
        e.preventDefault();
        // Move to the next tab
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
        const newNextTab = tabs[(currentIndex + 1) % tabs.length].id;
        setActiveTab(newNextTab);
        handleTabChange(newNextTab);
        break;

      case "Enter":
        e.preventDefault();
        console.log("Ennter key pressed", inputRef.current?.value);
        handleSubmit(inputRef.current?.value || "");
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    fetchResults(""); // Fetch results for the selected tab
  };

  const groupedItems = results
    ? Object.entries(results).reduce((acc, [sectionName, sectionItems]) => {
      if (sectionName === activeTab && sectionItems.length > 0) {
        acc[sectionName] = sectionItems.map((item: any) => ({
          id: item.id.toString(),
          label: item.title || item.filename || "Untitled",
          icon: item.favIconUrl ? (
            <img src={item.favIconUrl} alt="favicon" className="w-4 h-4" />
          ) : (
            <span>📄</span>
          ),
          metadata:
            item.lastVisitTime || item.startTime
              ? new Date(
                item.lastVisitTime || item.startTime!
              ).toLocaleString()
              : undefined,
          tabId: sectionName,
        }));
      }
      return acc;
    }, {} as Record<string, CommandItemData[]>)
    : {};

  if (!mounted) return null;

  return (
    <div className="relative h-full w-full flex items-start justify-center px-4 pt-32 rounded-lg">
      {isOpen && (
        <div
          className="w-full max-w-[800px] animate-in fade-in-0 slide-in-from-top-4 duration-200 relative rounded-xl"
          ref={commandRef}
        >
          <Command
            className="rounded-full border border-gray-500/20 shadow-2xl overflow-hidden flex flex-col bg-gray-900/40 backdrop-blur-sm"
            onKeyDown={handleKeyDown}
          >
            <div className="flex flex-col flex-none">
              <div className="">
                <CommandInput
                  ref={inputRef}
                  placeholder="Search for anything whatever you want 🔍🌎"
                  className="w-full h-16 text-base bg-transparent text-gray-100 placeholder-gray-300"
                  onValueChange={() =>
                    fetchResults(inputRef.current?.value || "")
                  }
                />
              </div>
              {/* <div className="border-b border-gray-600/20">
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
                        className="text-gray-300 data-[state=active]:bg-gray-700/50 data-[state=active]:text-gray-100 hover:bg-gray-700/30 transition-colors"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div> */}
            </div>
            {/* <div className="overflow-y-auto max-h-[80vh] p-2">
              <CommandList className="bg-transparent">
                <CommandEmpty className="text-gray-400">
                  No results found.
                </CommandEmpty>
                {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                  <CommandGroup
                    key={groupName}
                    heading={groupName}
                    className="text-gray-400"
                  >
                    {groupItems.map((item) => (
                      <CommandItem
                        key={item.id}
                        className="text-gray-200 hover:bg-gray-700/40 cursor-pointer"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.metadata && (
                          <span className="ml-auto text-xs text-gray-400">
                            {item.metadata}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                    </CommandGroup>
                    ))}
                    </CommandList>
                    </div> */}
          </Command>
        </div>
      )}
    </div>
  );
}
