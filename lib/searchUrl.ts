import { storage } from "wxt/storage";

// Create an async function to handle the retrieval of the search engine and the search logic
export const handleSearch = async (trimmedValue: string) => {
  // Retrieve the saved search engine asynchronously
  const savedSearchEngine = await storage.getItem("sync:defaultSearchEngine");

  // Handle search based on the saved search engine
  switch (savedSearchEngine) {
    case "google":
      handleGoogleSearch(trimmedValue);
      break;
    case "duckduckgo":
      handleDuckDuckGoSearch(trimmedValue);
      break;
    case "ecosia":
      handleEcosiaSearch(trimmedValue);
      break;
    case "bing":
      handleBingSearch(trimmedValue);
      break;
    default:
      handleGoogleSearch(trimmedValue); // Default to Google if no search engine is found
      break;
  }
};

// Handle Google search
const handleGoogleSearch = (trimmedValue: string) => {
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    trimmedValue
  )}`;
  window.open(searchUrl, "_blank");
};

// Handle DuckDuckGo search
const handleDuckDuckGoSearch = (trimmedValue: string) => {
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(
    trimmedValue
  )}`;
  window.open(searchUrl, "_blank");
};

const handleEcosiaSearch = (trimmedValue: string) => {
  const searchUrl = `https://www.ecosia.org/search?q=${encodeURIComponent(
    trimmedValue
  )}`;
  window.open(searchUrl, "_blank");
};
const handleBingSearch = (trimmedValue: string) => {
  const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(
    trimmedValue
  )}`;
  window.open(searchUrl, "_blank");
};
