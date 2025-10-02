import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import TrialRemaining from "./TrialRemaining";
import RowSkeleton from "./RowSkeleton";
import { handleSearch } from "@/lib/searchUtils";
import { FireIcon } from "@heroicons/react/24/solid";
import { usePremiumFeatures } from "@/hooks/PremiumFeaturesContext";
import GetPremiumFeature from "./GetPremiumFeature";
// import NewTab from "./BG-WorkerDemo";

interface SpotlightSearchProps {
  onClose: () => void;
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

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ onClose }) => {
  const { canAccessPremiumFeatures, isPaidUser } = usePremiumFeatures();
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] =
    useState<keyof SearchResult>("recent");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null
  );
  const [hasArrowKeyPressed, setHasArrowKeyPressed] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const [sectionCache, setSectionCache] = useState<SectionCache>({});

  const isValidUrl = useCallback((string: string): boolean => {
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(string.trim());
  }, []);
  // Handle tab action to activate or close the tab
  const handleTabAction = async (
    tabId: number,
    action: "activate" | "close"
  ) => {
    try {
      await browser.runtime.sendMessage({
        action: "tabAction",
        tabId,
        tabAction: action,
      });
      fetchResults(input); // Refresh results
      if (action === "activate") {
        onClose();
      }
    } catch (error) {
      console.error("Failed to perform tab action:", error);
    }
  };

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
      onClose();
    },
    [onClose, isValidUrl]
  );

  // Fetch results based on input
  const fetchResults = useCallback(
    async (searchTerm: string) => {
      if (searchTerm.length < 3) {
        setResults((prev) =>
          prev
            ? {
              ...prev,
              [activeSection]: [],
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
      if (sectionCache[activeSection]?.lastTerm === searchTerm) {
        setResults((prev) =>
          prev
            ? {
              ...prev,
              [activeSection]: sectionCache[activeSection].data,
            }
            : {
              recent: [],
              tabs: [],
              history: [],
              bookmarks: [],
              downloads: [],
              [activeSection]: sectionCache[activeSection].data,
            }
        );
        return;
      }

      setLoading(true);
      try {
        const response = await browser.runtime.sendMessage({
          action: "fetchSection",
          section: activeSection,
          searchTerm,
        });

        if (response) {
          // Update cache
          setSectionCache((prev) => ({
            ...prev,
            [activeSection]: {
              lastTerm: searchTerm,
              data: response[activeSection],
            },
          }));

          setResults((prev) => ({
            ...prev,
            ...response,
          }));
          // Reset selection and arrow key state when new results are fetched
          setSelectedItemIndex(null);
          setHasArrowKeyPressed(false);
        }
      } catch (error) {
        console.error("Failed to fetch results:", error);
      } finally {
        setLoading(false);
      }
    },
    [activeSection, sectionCache]
  );

  // Fetch results when input changes
  useEffect(() => {
    fetchResults(input);
  }, [input, activeSection, fetchResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results) return;

      const sections: (keyof SearchResult)[] = [
        "recent",
        "tabs",
        "history",
        "bookmarks",
        "downloads",
      ];
      const currentSectionResults = results[activeSection];

      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault();
          // Mark that arrow keys have been used
          setHasArrowKeyPressed(true);

          // If no item was previously selected, start selection from first item
          if (selectedItemIndex === null) {
            setSelectedItemIndex(
              e.key === "ArrowDown" ? 0 : currentSectionResults.length - 1
            );
            return;
          }

          // Existing navigation logic
          setSelectedItemIndex((prev) => {
            if (prev === null) return 0;
            if (e.key === "ArrowDown") {
              return prev < currentSectionResults.length - 1 ? prev + 1 : 0;
            } else {
              return prev > 0 ? prev - 1 : currentSectionResults.length - 1;
            }
          });
          break;
        case "ArrowRight":
          e.preventDefault();
          const currentIndex = sections.indexOf(activeSection);
          const nextSection = sections[(currentIndex + 1) % sections.length];
          setActiveSection(nextSection);
          setSelectedItemIndex(null);
          setHasArrowKeyPressed(false);
          break;
        case "ArrowLeft":
          e.preventDefault();
          const prevIndex = sections.indexOf(activeSection);
          const prevSection =
            sections[(prevIndex - 1 + sections.length) % sections.length];
          setActiveSection(prevSection);
          setSelectedItemIndex(null);
          setHasArrowKeyPressed(false);
          break;
        case "Enter":
          // If arrow keys were pressed, use the selected item
          if (
            hasArrowKeyPressed &&
            currentSectionResults.length > 0 &&
            selectedItemIndex !== null
          ) {
            const selectedItem = currentSectionResults[selectedItemIndex];
            handleItemSelect(selectedItem);
          }
          // else if There is no selected Item then submit the input
          else if (hasArrowKeyPressed === false && selectedItemIndex === null) {
            handleSubmit(input);
          }
          // If no arrow keys pressed, treat as search/address bar
          else if (input.trim()) {
            handleSubmit(input);
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    },
    [
      results,
      activeSection,
      selectedItemIndex,
      onClose,
      input,
      handleSubmit,
      hasArrowKeyPressed,
    ]
  );

  // Add this new handler function
  const handleDownloadAction = async (
    downloadId: number,
    action: "show" | "open"
  ) => {
    try {
      const response = await browser.runtime.sendMessage({
        action: "downloadAction",
        downloadId,
        downloadAction: action,
      });
      if (!response?.success) {
        throw new Error(response?.error || "Failed to perform download action");
      }
      onClose();
    } catch (error) {
      console.error("Failed to perform download action:", error);
    }
  };

  // Update the handleItemSelect function
  const handleItemSelect = (item: SearchItem) => {
    if ("filename" in item) {
      // Download item - show the file in system file manager
      handleDownloadAction(Number(item.id), "show");
      return;
    }

    if ("favIconUrl" in item) {
      // Tab item - activate the tab
      handleTabAction(Number(item.id), "activate");
      return;
    }

    // Open URL for history and bookmarks
    window.open(item.url, "_blank");
    onClose();
  };

  // Render section selector tabs
  const renderSectionTabs = () => {
    const sections: (keyof SearchResult)[] = [
      "recent",
      "tabs",
      "history",
      "bookmarks",
      "downloads",
    ];
    return (
      <>
        <div className="flex border-b sticky top-0 bg-transparent z-10">
          {sections.map((section) => (
            <button
              key={section}
              className={`flex-1 p-2 capitalize flex items-center justify-center gap-1 ${activeSection === section
                  ? " text-gray-100 font-semibold"
                  : "hover:bg-green-300"
                }`}
              onClick={() => {
                setActiveSection(section);
              }}
            >
              {section}
              {section !== "recent" && (
                <FireIcon className="h-4 w-4 text-amber-400" />
              )}
            </button>
          ))}
        </div>
      </>
    );
  };

  // Filter results based on input
  const filteredResults = () => {
    if (!results) return [];
    return results[activeSection] || [];
  };

  // Turncate text if it exceeds the maximum length
  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
  };

  // Render result items
  const renderResultItems = () => {
    const items = filteredResults();

    return items.map((item, index) => {
      let icon = null;
      let primaryText = "";
      let secondaryText = "";

      switch (activeSection) {
        case "recent":
          if ("favIconUrl" in item) {
            icon = item.favIconUrl ? (
              <img src={item.favIconUrl} alt="" className="w-4 h-4 mr-2" />
            ) : null;
          }
          primaryText = item.title;
          secondaryText = item.url;
          secondaryText += ` • ${new Date(
            item.lastVisitTime || Date.now()
          ).toLocaleString()}`;
          break;
        case "tabs":
          icon = (item as any).favIconUrl ? (
            <img
              src={(item as any).favIconUrl}
              alt=""
              className="w-4 h-4 mr-2"
            />
          ) : null;
          primaryText = item.title;
          secondaryText = item.url;
          break;
        case "history":
          primaryText = item.title;
          secondaryText = item.url;
          break;
        case "bookmarks":
          primaryText = item.title;
          secondaryText = item.url;
          break;
        case "downloads":
          primaryText = (item as any).filename;
          secondaryText = `${new Date(
            (item as any).startTime
          ).toLocaleString()} - ${(item as any).state}`;
          break;
      }

      return (
        <div
          key={item.id}
          ref={index === selectedItemIndex ? selectedItemRef : null}
          className={`flex items-center p-2 rounded-lg border cursor-pointer ${index === selectedItemIndex && hasArrowKeyPressed
              ? "bg-gray-800 border-green-300 text-gray-100"
              : "hover:bg-green-300"
            }`}
          onClick={() => {
            setHasArrowKeyPressed(true);
            setSelectedItemIndex(index);
            handleItemSelect(item);
          }}
        >
          {icon}
          <div className="flex-grow overflow-hidden max-w-full">
            <div className="truncate whitespace-nowrap overflow-hidden text-ellipsis font-semibold">
              {truncateText(primaryText, 90)}
            </div>
            <div className="text-xs text-gray-500 truncate whitespace-nowrap overflow-hidden text-ellipsis">
              {truncateText(secondaryText, 90)}
            </div>
          </div>
        </div>
      );
    });
  };

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedItemIndex]);
  return (
    <div
      id="quickpeek-search-container"
      className="flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl absolute top-[20%] transform transition-all px-4 animate-in fade-in-0 slide-in-from-top-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* <NewTab /> */}
        {!isPaidUser && <TrialRemaining />}

        <Command
          className="rounded-lg border border-gray-500/20 overflow-hidden flex flex-col bg-gray-500/15"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input Section */}
          <div className="sticky top-0 z-20">
            <CommandInput
              placeholder="Search tabs, history, bookmarks, downloads, or enter a URL..."
              className="w-full h-16 bg-transparent text-gray-100 placeholder-gray-400"
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
              autoFocus
            />
          </div>

          {/* Modified results section with premium check */}
          {input.length >= 3 && (
            <>
              {results && renderSectionTabs()}
              <ScrollArea className="h-[280px] py-1" scrollHideDelay={0}>
                {loading ? (
                  <div className="px-2">
                    <RowSkeleton count={4} />
                  </div>
                ) : (
                  results && (
                    <div className="p-2 space-y-2">
                      {activeSection === "recent" ||
                        canAccessPremiumFeatures ? (
                        renderResultItems()
                      ) : (
                        <GetPremiumFeature />
                      )}
                    </div>
                  )
                )}
              </ScrollArea>
            </>
          )}
        </Command>
      </div>
    </div>
  );
};

export default SpotlightSearch;
