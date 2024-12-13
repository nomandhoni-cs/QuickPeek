import React, { useState, useEffect, useCallback } from "react";
import {
  Command,
  CommandItem,
  CommandInput,
  CommandEmpty,
  CommandList,
  CommandGroup,
} from "./ui/command";

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
    setLoading(true);
    try {
      const response = await browser.runtime.sendMessage({
        action: "fetchAll",
        searchTerm,
      });
      if (response) {
        setResults(response);
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

  const handleSubmit = useCallback(
    async (value: string) => {
      // Check if it's a valid URL
      if (isValidUrl(value)) {
        const url = value.includes("://") ? value : `https://${value}`;
        window.open(url, "_blank");
      } else {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
          value
        )}`;
        window.open(searchUrl, "_blank");
      }
      onClose();
    },
    [onClose]
  );

  // Function to check if a string is a valid URL
  const isValidUrl = (string: string): boolean => {
    try {
      // Check if the string is a valid URL with or without the protocol
      new URL(string);
      return true;
    } catch (e) {
      // Try adding the 'https://' if it doesn't have any protocol and checking again
      try {
        new URL(`https://${string}`);
        return true;
      } catch (_) {
        return false;
      }
    }
  };

  const formatDownloadTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderSectionTabs = () => {
    return (
      <div className="flex border-b">
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
    return sectionResults.filter((item: any) =>
      JSON.stringify(Object.values(item))
        .toLowerCase()
        .includes(input.toLowerCase())
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="rounded-lg border shadow-md bg-white">
          <CommandInput
            placeholder="Search tabs, history, bookmarks, downloads, or enter a URL..."
            className="p-4"
            value={input}
            onValueChange={setInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && input.trim()) {
                handleSubmit(input.trim());
              }
              // If Escape key is pressed, close the search box
              if (e.key === "Escape") {
                onClose();
              }
            }}
            autoFocus
          />

          {renderSectionTabs()}

          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : (
            <CommandList className="max-h-[500px] overflow-y-auto">
              <CommandEmpty>No results found.</CommandEmpty>
              {results && (
                <>
                  {activeSection === "tabs" && (
                    <CommandGroup heading="Open Tabs">
                      {filteredResults("tabs").map((tab) => (
                        <CommandItem
                          key={tab.id}
                          onSelect={() => handleTabAction(tab.id, "activate")}
                        >
                          <div className="flex items-center w-full">
                            {tab.favIconUrl && (
                              <img
                                src={tab.favIconUrl}
                                alt=""
                                className="w-4 h-4 mr-2"
                              />
                            )}
                            <span className="flex-grow">{tab.title}</span>
                            <div className="ml-auto flex items-center">
                              <span className="text-xs text-gray-500 mr-2">
                                {tab.url}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTabAction(tab.id, "close");
                                }}
                                className="text-red-500 hover:bg-red-100 rounded-full p-1"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {activeSection === "history" && (
                    <CommandGroup heading="History">
                      {filteredResults("history").map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => window.open(item.url, "_blank")}
                        >
                          <div className="flex items-center w-full">
                            <span className="flex-grow">{item.title}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {item.url}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {activeSection === "bookmarks" && (
                    <CommandGroup heading="Bookmarks">
                      {filteredResults("bookmarks").map((bookmark) => (
                        <CommandItem
                          key={bookmark.id}
                          onSelect={() => window.open(bookmark.url, "_blank")}
                        >
                          <div className="flex items-center w-full">
                            <span className="flex-grow">{bookmark.title}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {bookmark.url}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {activeSection === "downloads" && (
                    <CommandGroup heading="Downloads">
                      {filteredResults("downloads").map((download) => (
                        <CommandItem key={download.id}>
                          <div className="flex items-center w-full">
                            <span className="flex-grow">
                              {download.filename}
                            </span>
                            <div className="text-xs text-gray-500 ml-2 flex items-center">
                              <span className="mr-2">
                                {formatDownloadTime(download.startTime)}
                              </span>
                              <span>{download.state}</span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          )}
        </Command>
      </div>
    </div>
  );
};

export default SpotlightSearch;
