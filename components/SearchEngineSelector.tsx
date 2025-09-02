// SearchEngineSelector.tsx - Fixed version without style jsx
import { CheckIcon } from "@heroicons/react/16/solid";
import React, { useEffect, useState } from "react";
import { storage } from "wxt/storage";

const searchEngines = [
  { name: "Google", url: "https://www.google.com", color: "from-blue-400 to-blue-600" },
  { name: "Ecosia", url: "https://www.ecosia.org", color: "from-green-400 to-green-600" },
  { name: "DuckDuckGo", url: "https://duckduckgo.com", color: "from-orange-400 to-orange-600" },
  { name: "Bing", url: "https://www.bing.com", color: "from-cyan-400 to-cyan-600" },
];

const SearchEngineSelector: React.FC = () => {
  const [activeSearchEngine, setActiveSearchEngine] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSearchEngine = async () => {
      const savedSearchEngine = await storage.getItem("sync:defaultSearchEngine");
      setActiveSearchEngine(savedSearchEngine ? (savedSearchEngine as string) : "google");
      setLoading(false);
    };
    fetchSearchEngine();
  }, []);

  const handleSelectEngine = async (engine: string) => {
    const engineLowerCase = engine.toLowerCase();
    setActiveSearchEngine(engineLowerCase);
    await storage.setItem("sync:defaultSearchEngine", engineLowerCase);
  };

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Default Search Engine
      </h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {searchEngines.map((engine) => (
            <div
              key={engine.name}
              className={`relative group cursor-pointer rounded-xl p-4 transition-all duration-300 transform hover:scale-[1.02] ${activeSearchEngine === engine.name.toLowerCase()
                ? `bg-gradient-to-r ${engine.color} shadow-lg`
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              onClick={() => handleSelectEngine(engine.name)}
            >
              {activeSearchEngine === engine.name.toLowerCase() && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-emerald-500" />
                </div>
              )}

              <div className="flex items-center space-x-3">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${engine.url}&sz=32`}
                  alt={`${engine.name} icon`}
                  className="w-8 h-8 transition-transform duration-300 group-hover:rotate-12"
                />
                <span className={`font-medium ${activeSearchEngine === engine.name.toLowerCase()
                  ? "text-white"
                  : "text-gray-700 dark:text-gray-300"
                  }`}>
                  {engine.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchEngineSelector;