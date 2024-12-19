import { encryptData } from "@/lib/cryptoUtils";
import { installNanoId } from "@/lib/storage";
import { nanoid } from "nanoid";

export default defineBackground(() => {
  console.log("Spotlight Search Extension Initialized", {
    id: browser.runtime.id,
  });
  browser.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  browser.runtime.setUninstallURL("https://blinkeye.app/en/goodbye", () => {
    console.log("Uninstall URL has been set");
  });
  // Utility function to set the encrypted installation date
  const setEncryptedInstallDate = async () => {
    const currentTimestamp = Date.now().toString();
    const encryptedDate = await encryptData(currentTimestamp);
    const existingInstallDate = await storage.getItem<number[]>(
      "sync:installDate"
    );
    if (existingInstallDate) {
      console.log("Existing installation date found:", existingInstallDate);
      return;
    }
    await storage.setItem("sync:installDate", JSON.stringify(encryptedDate));
    console.log("Encrypted installation date stored:", encryptedDate);
  };

  // Listener for extension installation/updates
  browser.runtime.onInstalled.addListener(async (details) => {
    console.log("Extension installed/updated:", details);

    try {
      // Ensure Nano ID is initialized
      let nanoId = await installNanoId.getValue();
      if (!nanoId) {
        await installNanoId.setValue(nanoid()); // Set the value
        nanoId = await installNanoId.getValue(); // Retrieve the value after setting
        console.log("Nano ID generated:", nanoId);
      } else {
        console.log("Nano ID already initialized:", nanoId);
      }

      // Set the encrypted installation date
      await setEncryptedInstallDate();

      // Set default search engine
      const defaultSearchEngineKey = "sync:defaultSearchEngine";
      const existingSearchEngine = await storage.getItem<string>(
        defaultSearchEngineKey
      );
      if (!existingSearchEngine) {
        await storage.setItem(defaultSearchEngineKey, "google");
        console.log("Default search engine set to 'google'");
      }
    } catch (error) {
      console.error("Error during initialization:", error);
    }
    // After installing / Updating open this url
    browser.tabs.create({
      url: browser.runtime.getURL("/usermanual.html"),
    });
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message:", message);
    const searchTerm = message.searchTerm?.toLowerCase() || "";
    console.log("Search term:", searchTerm);

    if (message.action === "fetchAll") {
      Promise.all([
        // Fetch Recent items (4 most recent matches)
        new Promise<chrome.history.HistoryItem[]>((resolve) => {
          browser.history.search(
            {
              text: searchTerm,
              maxResults: 4, // Only get 4 most recent matches
              startTime: 0,
            },
            (history) => resolve(history)
          );
        }),

        // Fetch Tabs
        new Promise<chrome.tabs.Tab[]>((resolve) => {
          browser.tabs.query({}, (tabs) => resolve(tabs));
        }),

        // Fetch History
        new Promise<chrome.history.HistoryItem[]>((resolve) => {
          browser.history.search(
            {
              text: searchTerm,
              maxResults: 50,
              startTime: 0,
            },
            (history) => resolve(history)
          );
        }),

        // Fetch Bookmarks
        new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) => {
          browser.bookmarks.search(searchTerm, (bookmarks) =>
            resolve(bookmarks)
          );
        }),

        // Fetch Downloads
        new Promise<chrome.downloads.DownloadItem[]>((resolve) => {
          browser.downloads.search({ state: "complete" }, (downloads) =>
            resolve(downloads)
          );
        }),
      ])
        .then(([recentHistory, tabs, history, bookmarks, downloads]) => {
          // Filter recent items that are most relevant
          const recentItems = recentHistory.map((item) => ({
            type: "recent",
            id: item.id,
            url: item.url || "",
            title: item.title || "",
            lastVisitTime: item.lastVisitTime,
          }));

          // Sort tabs into matching and non-matching
          const [matchingTabs, nonMatchingTabs] = tabs.reduce(
            ([matching, nonMatching], tab) => {
              const isMatch =
                tab.title?.toLowerCase().includes(searchTerm) ||
                tab.url?.toLowerCase().includes(searchTerm);
              return isMatch
                ? [[...matching, tab], nonMatching]
                : [matching, [...nonMatching, tab]];
            },
            [[], []] as [chrome.tabs.Tab[], chrome.tabs.Tab[]]
          );

          // Combine matching and non-matching tabs
          const sortedTabs = [...matchingTabs, ...nonMatchingTabs];
          console.log("Sorted Tabs:", sortedTabs);

          // Sort downloads into matching and non-matching
          const [matchingDownloads, nonMatchingDownloads] = downloads.reduce(
            ([matching, nonMatching], download) => {
              const isMatch =
                download.filename?.toLowerCase().includes(searchTerm) ||
                download.url?.toLowerCase().includes(searchTerm);
              return isMatch
                ? [[...matching, download], nonMatching]
                : [matching, [...nonMatching, download]];
            },
            [[], []] as [
              chrome.downloads.DownloadItem[],
              chrome.downloads.DownloadItem[]
            ]
          );

          // Combine matching and non-matching downloads
          const sortedDownloads = [
            ...matchingDownloads,
            ...nonMatchingDownloads,
          ];
          console.log("Sorted Downloads:", sortedDownloads);

          // Prepare response with sorted data
          const response = {
            recent: recentItems,
            tabs: sortedTabs.map((tab) => ({
              id: tab.id,
              url: tab.url || "",
              title: tab.title || "",
              active: tab.active,
              favIconUrl: tab.favIconUrl,
              isMatch: matchingTabs.includes(tab), // Add flag to indicate if it's a match
            })),
            history: history.map((item) => ({
              id: item.id,
              url: item.url || "",
              title: item.title || "",
              lastVisitTime: item.lastVisitTime,
            })),
            bookmarks: bookmarks.map((bookmark) => ({
              id: bookmark.id,
              url: bookmark.url || "",
              title: bookmark.title || "",
              parentId: bookmark.parentId,
            })),
            downloads: sortedDownloads.map((download) => ({
              id: download.id,
              url: download.url || "",
              filename: download.filename
                ? download.filename.split(/[/\\]/).pop() || ""
                : "",
              state: download.state,
              startTime: download.startTime,
              finalUrl: download.finalUrl || "",
              isMatch: matchingDownloads.includes(download), // Add flag to indicate if it's a match
            })),
          };

          sendResponse(response);
        })
        .catch((error) => {
          // console.error("Error fetching data:", error);
          sendResponse(null);
        });

      return true;
    }

    if (message.action === "tabAction") {
      const { tabId, tabAction } = message;
      if (tabAction === "activate") {
        browser.tabs.update(tabId, { active: true });
      } else if (tabAction === "close") {
        browser.tabs.remove(tabId);
      }
      return true;
    }

    if (message.action === "downloadAction") {
      const { downloadId, downloadAction } = message;
      if (downloadAction === "show") {
        browser.downloads.show(downloadId);
      } else if (downloadAction === "open") {
        browser.downloads.open(downloadId);
      }
      sendResponse({ success: true });
      return true;
    }
  });
});
