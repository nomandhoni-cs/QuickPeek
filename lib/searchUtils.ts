import { storage } from "wxt/storage";

// ============================================
// SEARCH ENGINE HANDLING
// ============================================

type SearchEngine = "google" | "duckduckgo" | "ecosia" | "bing";

const SEARCH_ENGINES: Record<SearchEngine, (query: string) => string> = {
  google: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  duckduckgo: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
  ecosia: (query) => `https://www.ecosia.org/search?q=${encodeURIComponent(query)}`,
  bing: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
};

/**
 * Main search handler - opens search in new tab based on user's preferred search engine
 */
export const handleSearch = async (trimmedValue: string) => {
  if (!trimmedValue.trim()) return;

  try {
    const savedSearchEngine = await storage.getItem<SearchEngine>("sync:defaultSearchEngine");
    const searchEngine = savedSearchEngine || "google";

    const searchUrl = SEARCH_ENGINES[searchEngine]?.(trimmedValue) || SEARCH_ENGINES.google(trimmedValue);
    window.open(searchUrl, "_blank");
  } catch (error) {
    console.error("Error retrieving search engine:", error);
    window.open(SEARCH_ENGINES.google(trimmedValue), "_blank");
  }
};

// ============================================
// URL VALIDATION
// ============================================

/**
 * Check if a string is a valid URL
 */
export const isValidUrl = (string: string): boolean => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return urlRegex.test(string.trim());
};

/**
 * Open URL in new tab (adds https:// if not present)
 */
export const openUrl = (url: string) => {
  const trimmedUrl = url.trim();
  const finalUrl = trimmedUrl.includes("://") ? trimmedUrl : `https://${trimmedUrl}`;
  window.open(finalUrl, "_blank");
};

// ============================================
// CALCULATOR
// ============================================

/**
 * Safely evaluate arithmetic expressions without using eval
 */
export const calculateExpression = (expression: string): string | null => {
  try {
    const cleanExpression = expression.replace(/\s/g, "");

    if (!/^[\d+\-*/().]+$/.test(cleanExpression)) {
      return null;
    }

    if (
      cleanExpression.includes("//") ||
      cleanExpression.includes("**") ||
      cleanExpression.includes("++") ||
      cleanExpression.includes("--")
    ) {
      return null;
    }

    let parenCount = 0;
    for (const char of cleanExpression) {
      if (char === "(") parenCount++;
      if (char === ")") parenCount--;
      if (parenCount < 0) return null;
    }
    if (parenCount !== 0) return null;

    const result = safeEvaluate(cleanExpression);

    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return Number.isInteger(result)
        ? result.toString()
        : Number.parseFloat(result.toFixed(10)).toString();
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Internal function to safely evaluate mathematical expressions
 */
const safeEvaluate = (expr: string): number => {
  expr = expr.replace(/\s/g, "");

  while (expr.includes("(")) {
    const start = expr.lastIndexOf("(");
    const end = expr.indexOf(")", start);
    if (end === -1) throw new Error("Mismatched parentheses");

    const subExpr = expr.substring(start + 1, end);
    const subResult = safeEvaluate(subExpr);
    expr = expr.substring(0, start) + subResult + expr.substring(end + 1);
  }

  while (expr.match(/[\d.]+[*/][\d.]+/)) {
    expr = expr.replace(/(\d+\.?\d*)\s*([*/])\s*(\d+\.?\d*)/, (match, a, op, b) => {
      const numA = Number.parseFloat(a);
      const numB = Number.parseFloat(b);
      if (op === "*") return (numA * numB).toString();
      if (op === "/") {
        if (numB === 0) throw new Error("Division by zero");
        return (numA / numB).toString();
      }
      return match;
    });
  }

  while (expr.match(/[\d.]+[+-][\d.]+/)) {
    expr = expr.replace(/(\d+\.?\d*)\s*([+-])\s*(\d+\.?\d*)/, (match, a, op, b) => {
      const numA = Number.parseFloat(a);
      const numB = Number.parseFloat(b);
      if (op === "+") return (numA + numB).toString();
      if (op === "-") return (numA - numB).toString();
      return match;
    });
  }

  const result = Number.parseFloat(expr);
  if (isNaN(result)) throw new Error("Invalid expression");
  return result;
};

// ============================================
// SEARCH SUGGESTIONS
// ============================================

/**
 * Fetch search suggestions from DuckDuckGo API
 */
export const fetchSearchSuggestions = async (query: string): Promise<string[]> => {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch suggestions");

    const data = await response.json();
    const suggestionList = Array.isArray(data) && data.length > 1 ? data[1] : [];

    return suggestionList.slice(0, 5);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return generateFallbackSuggestions(query);
  }
};

/**
 * Generate fallback suggestions when API fails
 */
const generateFallbackSuggestions = (query: string): string[] => {
  return [
    `${query} tutorial`,
    `${query} guide`,
    `how to ${query}`,
    `${query} examples`,
  ].slice(0, 4);
};

// ============================================
// UNIFIED SEARCH EXECUTOR
// ============================================

/**
 * Execute search - handles URLs, calculations, and regular searches
 */
export const executeSearch = async (value: string): Promise<void> => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return;

  // Check if it's a URL
  if (isValidUrl(trimmedValue)) {
    openUrl(trimmedValue);
    return;
  }

  // Check if it's a calculation
  const calculationResult = calculateExpression(trimmedValue);
  if (calculationResult) {
    await navigator.clipboard.writeText(calculationResult);
    return;
  }

  // Default to search
  await handleSearch(trimmedValue);
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the current search engine
 */
export const getCurrentSearchEngine = async (): Promise<SearchEngine> => {
  try {
    const savedSearchEngine = await storage.getItem<SearchEngine>("sync:defaultSearchEngine");
    return savedSearchEngine || "google";
  } catch (error) {
    console.error("Error getting search engine:", error);
    return "google";
  }
};

/**
 * Set the default search engine
 */
export const setSearchEngine = async (engine: SearchEngine): Promise<void> => {
  try {
    await storage.setItem("sync:defaultSearchEngine", engine);
  } catch (error) {
    console.error("Error setting search engine:", error);
  }
};

/**
 * Get available search engines
 */
export const getAvailableSearchEngines = (): SearchEngine[] => {
  return Object.keys(SEARCH_ENGINES) as SearchEngine[];
};