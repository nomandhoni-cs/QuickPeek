import React, { useState, useEffect, useCallback, useRef } from "react";
import { Command, CommandInput } from "./ui/command";
import { ScrollArea } from "./ui/scroll-area";

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
}

interface SearchResult {
  tabs: SearchItem[];
  history: SearchItem[];
  bookmarks: SearchItem[];
  downloads: SearchItem[];
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ onClose }) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] =
    useState<keyof SearchResult>("tabs");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
    null
  );
  const [hasArrowKeyPressed, setHasArrowKeyPressed] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

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
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
          trimmedValue
        )}`;
        window.open(searchUrl, "_blank");
      }
      onClose();
    },
    [onClose, isValidUrl]
  );

  // Fetch results based on input
  const fetchResults = useCallback(async (searchTerm: string) => {
    if (searchTerm.length < 3) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await browser.runtime.sendMessage({
        action: "fetchAll",
        searchTerm,
      });
      if (response) {
        setResults(response);
        // Reset selection and arrow key state when new results are fetched
        setSelectedItemIndex(null);
        setHasArrowKeyPressed(false);
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch results when input changes
  useEffect(() => {
    fetchResults(input);
  }, [input, fetchResults]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results) return;

      const sections: (keyof SearchResult)[] = [
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

  // Handle item selection (open URL or perform action)
  const handleItemSelect = (item: SearchItem) => {
    if ("filename" in item) {
      // Download item - no specific action
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
      "tabs",
      "history",
      "bookmarks",
      "downloads",
    ];
    return (
      <div className="flex border-b sticky top-0 bg-white z-10">
        {sections.map((section) => (
          <button
            key={section}
            className={`flex-1 p-2 capitalize ${
              activeSection === section
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "hover:bg-gray-100"
            }`}
            onClick={() => {
              setActiveSection(section);
              setSelectedItemIndex(null);
              setHasArrowKeyPressed(false);
            }}
          >
            {section}
          </button>
        ))}
      </div>
    );
  };

  // Filter results based on input
  const filteredResults = () => {
    if (!results) return [];

    const sectionResults = results[activeSection];
    const searchRegex = new RegExp(input.trim(), "i");
    return sectionResults.filter((item: any) =>
      Object.values(item).some(
        (value) => value && searchRegex.test(value.toString())
      )
    );
  };

  // Render result items
  const renderResultItems = () => {
    const items = filteredResults();

    return items.map((item, index) => {
      let icon = null;
      let primaryText = "";
      let secondaryText = "";

      switch (activeSection) {
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
          className={`flex items-center p-2 rounded-lg border cursor-pointer ${
            index === selectedItemIndex && hasArrowKeyPressed
              ? "bg-blue-100 border-blue-300"
              : "hover:bg-gray-50"
          }`}
          onClick={() => {
            setHasArrowKeyPressed(true);
            setSelectedItemIndex(index);
            handleItemSelect(item);
          }}
        >
          {icon}
          <div className="flex-grow overflow-hidden">
            <div className="truncate">{primaryText}</div>
            <div className="text-xs text-gray-500 truncate">
              {secondaryText}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl absolute top-[40%] transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          className="rounded-xl border shadow-2xl bg-white overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input Section */}
          <div className="sticky top-0 z-20 bg-white border-b">
            <CommandInput
              placeholder="Search tabs, history, bookmarks, downloads, or enter a URL..."
              className="h-14 px-4 border-none focus:ring-0"
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
              autoFocus
            />
          </div>

          {/* Results Section */}
          {results && !loading && (
            <ScrollArea className="h-[300px]">
              {renderSectionTabs()}
              <div className="p-4 space-y-2">
                {renderResultItems()}

                {renderResultItems().length === 0 && (
                  <div className="text-center text-gray-500">
                    No results found
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center p-8 text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2" />
              <span>Loading...</span>
            </div>
          )}
        </Command>
      </div>
    </div>
  );
};

export default SpotlightSearch;
