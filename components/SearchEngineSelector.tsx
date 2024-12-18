import { CheckIcon } from "@heroicons/react/16/solid";
import React, { useEffect, useState } from "react";
import { storage } from "wxt/storage";

const searchEngines = [
  { name: "Google", url: "https://www.google.com", icon: "google" },
  { name: "Ecosia", url: "https://www.ecosia.org", icon: "ecosia" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com", icon: "duckduckgo" },
  { name: "Bing", url: "https://www.bing.com", icon: "bing" },
];

const SearchEngineSelector: React.FC = () => {
  const [activeSearchEngine, setActiveSearchEngine] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the saved search engine from storage
  useEffect(() => {
    const fetchSearchEngine = async () => {
      // Ensure we correctly type the result from storage
      const savedSearchEngine = await storage.getItem(
        "sync:defaultSearchEngine"
      );

      console.log(savedSearchEngine);

      // Type assertion to make sure savedSearchEngine is a string (if it's not, default to "google")
      setActiveSearchEngine(
        savedSearchEngine ? (savedSearchEngine as string) : "google"
      );
      setLoading(false);
    };

    fetchSearchEngine();
  }, []);

  // Update the active search engine and save it to storage
  const handleSelectEngine = async (engine: string) => {
    const engineLowerCase = engine.toLocaleLowerCase(); // Store the engine in lowercase
    setActiveSearchEngine(engineLowerCase);
    await storage.setItem("sync:defaultSearchEngine", engineLowerCase);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center">
        Select your default search engine
      </h3>

      {loading ? (
        <p className="text-gray-500 text-lg text-center">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {searchEngines.map((engine) => (
            <div
              key={engine.name}
              className={`relative flex items-center p-3 cursor-pointer rounded-lg border-2 transition-all duration-300 hover:shadow-md ${
                activeSearchEngine === engine.name.toLowerCase()
                  ? `border-[#32CD32] bg-[#32CD32]/10`
                  : "border-gray-300 hover:border-[#32CD32]/50"
              }`}
              onClick={() => handleSelectEngine(engine.name)}
            >
              {activeSearchEngine === engine.name.toLowerCase() && (
                <div className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 bg-white rounded-full border-2 border-[#32CD32]">
                  <CheckIcon className="w-3 h-3 text-[#32CD32]" />
                </div>
              )}

              <img
                src={`https://www.google.com/s2/favicons?domain=${engine.url}&sz=32`}
                alt={`${engine.name} icon`}
                className="w-8 h-8 mr-3"
              />
              <div className="font-medium text-sm sm:text-base">
                {engine.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchEngineSelector;
