export default defineBackground(() => {
  console.log("Spotlight Search Extension Initialized", {
    id: browser.runtime.id,
  });

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchAll") {
      const searchTerm = message.searchTerm?.toLowerCase() || "";

      // Parallel promises to fetch all data
      Promise.all([
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
          browser.downloads.search({}, (downloads) => resolve(downloads));
        }),
      ])
        .then(([tabs, history, bookmarks, downloads]) => {
          // Prepare response with filtered and simplified data
          const response = {
            tabs: tabs.map((tab) => ({
              id: tab.id,
              url: tab.url || "",
              title: tab.title || "",
              active: tab.active,
              favIconUrl: tab.favIconUrl,
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
            downloads: downloads.map((download) => ({
              id: download.id,
              url: download.url || "",
              filename: download.filename
                ? download.filename.split(/[/\\]/).pop() || ""
                : "",
              state: download.state,
              startTime: download.startTime,
              finalUrl: download.finalUrl || "",
            })),
          };

          sendResponse(response);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          sendResponse(null);
        });

      // Return true to indicate asynchronous response
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
  });
});
