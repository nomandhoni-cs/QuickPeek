import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Command,
  CommandItem,
  CommandInput,
  CommandEmpty,
  CommandList,
  CommandGroup,
} from "./ui/command";
import { ScrollArea } from "./ui/scroll-area";

interface SpotlightSearchProps {
  onClose: () => void;
}

interface SearchResult {
  tabs: Array<{
    id: number;
    url: string;
    title: string;
    active: boolean;
    favIconUrl?: string;
  }>;
  history: Array<{
    id: string;
    url: string;
    title: string;
    lastVisitTime: number;
  }>;
  bookmarks: Array<{
    id: string;
    url: string;
    title: string;
    parentId?: string;
  }>;
  downloads: Array<{
    id: number;
    url: string;
    filename: string;
    state: string;
    startTime: number;
    finalUrl: string;
  }>;
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ onClose }) => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "tabs" | "history" | "bookmarks" | "downloads"
  >("tabs");

  const fetchResults = useCallback(async (searchTerm: string) => {
    // Only fetch if search term is at least 3 characters
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
        console.log(response);
      }
    } catch (error) {
      console.error("Failed to fetch results:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(input);
  }, [input, fetchResults]);

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

  // Improved URL detection using regex
  const isValidUrl = useCallback((string: string): boolean => {
    // Regex for URL detection:
    // 1. Allows optional protocol (http://, https://, etc.)
    // 2. Requires a domain name
    // 3. Must have a dot followed by a top-level domain
    // 4. No spaces allowed
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlRegex.test(string.trim());
  }, []);

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmedValue = value.trim();

      // Check if it's a valid URL
      if (isValidUrl(trimmedValue)) {
        const url = trimmedValue.includes("://")
          ? trimmedValue
          : `https://${trimmedValue}`;
        window.open(url, "_blank");
      } else {
        // If not a URL, perform a Google search
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
          trimmedValue
        )}`;
        window.open(searchUrl, "_blank");
      }
      onClose();
    },
    [onClose, isValidUrl]
  );

  const formatDownloadTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderSectionTabs = () => {
    return (
      <div className="flex border-b sticky top-0 bg-white z-10">
        {["tabs", "history", "bookmarks", "downloads"].map((section) => (
          <button
            key={section}
            className={`flex-1 p-2 capitalize ${
              activeSection === section
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "hover:bg-gray-100"
            }`}
            onClick={() => setActiveSection(section as any)}
          >
            {section}
          </button>
        ))}
      </div>
    );
  };

  const filteredResults = (section: keyof SearchResult) => {
    if (!results) return [];

    const sectionResults = results[section];
    // Use regex for case-insensitive search across all fields
    const searchRegex = new RegExp(input.trim(), "i");
    return sectionResults.filter((item: any) =>
      Object.values(item).some(
        (value) => value && searchRegex.test(value.toString())
      )
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-3xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-xl border shadow-2xl bg-white overflow-hidden">
          {/* Search Input Section */}
          <div className="sticky top-0 z-20 bg-white border-b">
            <CommandInput
              placeholder="Search tabs, history, bookmarks, downloads, or enter a URL..."
              className="h-14 px-4 border-none focus:ring-0"
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim())
                  handleSubmit(input.trim());
                if (e.key === "Escape") onClose();
              }}
              autoFocus
            />
          </div>

          <ScrollArea className="h-[500px]">
            <div className="p-4">
              {results && !loading && (
                <div className="space-y-6">
                  {/* Tabs Section */}
                  {results.tabs.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tabs</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {results.tabs.slice(0, 3).map((tab) => (
                          <div
                            key={tab.id}
                            className="flex items-center p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleTabAction(tab.id, "activate")}
                          >
                            {tab.favIconUrl && (
                              <img
                                src={tab.favIconUrl}
                                alt=""
                                className="w-4 h-4 mr-2"
                              />
                            )}
                            <div className="flex-grow overflow-hidden">
                              <div className="truncate">{tab.title}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {tab.url}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTabAction(tab.id, "close");
                              }}
                              className="ml-2 text-red-500 hover:bg-red-100 rounded-full p-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History Section */}
                  {results.history.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">History</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {results.history.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                            onClick={() => window.open(item.url, "_blank")}
                          >
                            <div className="flex-grow overflow-hidden">
                              <div className="truncate">{item.title}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {item.url}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bookmarks Section */}
                  {results.bookmarks.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Bookmarks</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {results.bookmarks.slice(0, 3).map((bookmark) => (
                          <div
                            key={bookmark.id}
                            className="flex items-center p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                            onClick={() => window.open(bookmark.url, "_blank")}
                          >
                            <div className="flex-grow overflow-hidden">
                              <div className="truncate">{bookmark.title}</div>
                              <div className="text-xs text-gray-500 truncate">
                                {bookmark.url}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Downloads Section */}
                  {results.downloads.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Downloads</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {results.downloads.slice(0, 3).map((download) => (
                          <div
                            key={download.id}
                            className="flex items-center p-2 rounded-lg border hover:bg-gray-50"
                          >
                            <div className="flex-grow overflow-hidden">
                              <div className="truncate">
                                {download.filename}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center">
                                <span className="mr-2">
                                  {formatDownloadTime(download.startTime)}
                                </span>
                                <span>{download.state}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results Message */}
                  {!results.tabs.length &&
                    !results.history.length &&
                    !results.bookmarks.length &&
                    !results.downloads.length && (
                      <div className="text-center text-gray-500">
                        No results found
                      </div>
                    )}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center p-8 text-gray-500">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mr-2" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </Command>
      </div>
    </div>
  );
};

export default SpotlightSearch;
