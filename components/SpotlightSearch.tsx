import React, { useState, useEffect, useCallback, useRef } from "react";
import { Command, CommandInput } from "./ui/command";
import { ScrollArea } from "./ui/scroll-area";
import TrialRemaining from "./TrialRemaining";
import RowSkeleton from "./RowSkeleton";
import { handleSearch } from "@/lib/searchUrl";

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
  const selectedItemRef = useRef<HTMLDivElement>(null);

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

  // Add this new handler function
  const handleDownloadAction = async (
    downloadId: number,
    action: "show" | "open"
  ) => {
    try {
      await browser.runtime.sendMessage({
        action: "downloadAction",
        downloadId,
        downloadAction: action,
      });
      onClose();
    } catch (error) {
      // console.error("Failed to perform download action:", error);
      alert(error);
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
                ? "bg-[#32CD32] text-black font-semibold"
                : "hover:bg-green-300"
            }`}
            onClick={() => {
              setActiveSection(section);
              // setSelectedItemIndex(null);
              // setHasArrowKeyPressed(false);
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
          className={`flex items-center p-2 rounded-lg border cursor-pointer ${
            index === selectedItemIndex && hasArrowKeyPressed
              ? "bg-green-200 border-green-300"
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
        className="w-full max-w-4xl absolute top-[20%] transform transition-all px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <TrialRemaining />

          <a
            href="https://buymeacoffee.com/nomandhoni"
            className="inline-flex items-center bg-yellow-400 rounded-lg p-2 text-xs text-black cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="mr-1">Buy me a coffee</span>
            <svg
              role="img"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <title>Buy Me A Coffee</title>
              <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.899-.13 1.345-.21.399-.072.84-.206 1.08.206.166.281.188.657.162.974a.544.544 0 01-.169.364zm-6.159 3.9c-.862.37-1.84.788-3.109.788a5.884 5.884 0 01-1.569-.217l.877 9.004c.065.78.717 1.38 1.5 1.38 0 0 1.243.065 1.658.065.447 0 1.786-.065 1.786-.065.783 0 1.434-.6 1.499-1.38l.94-9.95a3.996 3.996 0 00-1.322-.238c-.826 0-1.491.284-2.26.613z" />
            </svg>
          </a>
        </div>

        <Command
          className="rounded-xl border shadow-xl bg-white dark:bg-black overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input Section */}
          <div className="sticky top-0 z-20 bg-white dark:bg-black border-b">
            <CommandInput
              placeholder="Search tabs, history, bookmarks, downloads, or enter a URL..."
              className="h-16 px-1 border-none focus:ring-0 font-semibold text-base"
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
              }}
              autoFocus
            />
          </div>

          {/* Results Section */}
          {results && renderSectionTabs()}
          {results && !loading && (
            <ScrollArea className="h-[300px] py-2" scrollHideDelay={0}>
              <div className="p-2 space-y-2">
                {renderResultItems()}
                {renderResultItems().length === 0 && (
                  <div className="text-center text-gray-500">
                    No results found
                  </div>
                )}
              </div>
              {loading && <RowSkeleton count={4} />}
            </ScrollArea>
          )}
          {/* Loading State */}
        </Command>
      </div>
    </div>
  );
};

export default SpotlightSearch;
