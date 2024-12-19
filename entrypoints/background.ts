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

  browser.runtime.setUninstallURL("https://blinkeye.app/en/goodbye", () => {});
  // Utility function to set the encrypted installation date
  const setEncryptedInstallDate = async () => {
    const currentTimestamp = Date.now().toString();
    const encryptedDate = await encryptData(currentTimestamp);
    const existingInstallDate = await storage.getItem<number[]>(
      "sync:installDate"
    );
    if (existingInstallDate) {
      return;
    }
    await storage.setItem("sync:installDate", JSON.stringify(encryptedDate));
  };

  // Listener for extension installation/updates
  browser.runtime.onInstalled.addListener(async (details) => {
    try {
      // Ensure Nano ID is initialized
      let nanoId = await installNanoId.getValue();
      if (!nanoId) {
        await installNanoId.setValue(nanoid()); // Set the value
        nanoId = await installNanoId.getValue(); // Retrieve the value after setting
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
    const searchTerm = message.searchTerm?.toLowerCase() || "";

    // New section-specific fetch handlers
    if (message.action === "fetchSection") {
      const { section } = message;

      switch (section) {
        case "recent":
          browser.history.search(
            {
              text: searchTerm,
              maxResults: 4,
              startTime: 0,
            },
            (history) => {
              sendResponse({
                recent: history.map((item) => ({
                  id: item.id,
                  url: item.url || "",
                  title: item.title || "",
                  lastVisitTime: item.lastVisitTime,
                })),
              });
            }
          );
          break;

        case "tabs":
          browser.tabs.query({}, (tabs) => {
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

            sendResponse({
              tabs: [...matchingTabs, ...nonMatchingTabs].map((tab) => ({
                id: tab.id,
                url: tab.url || "",
                title: tab.title || "",
                active: tab.active,
                favIconUrl: tab.favIconUrl,
                isMatch: matchingTabs.includes(tab),
              })),
            });
          });
          break;

        case "history":
          browser.history.search(
            {
              text: searchTerm,
              maxResults: 50,
              startTime: 0,
            },
            (history) => {
              sendResponse({
                history: history.map((item) => ({
                  id: item.id,
                  url: item.url || "",
                  title: item.title || "",
                  lastVisitTime: item.lastVisitTime,
                })),
              });
            }
          );
          break;

        case "bookmarks":
          browser.bookmarks.search(searchTerm, (bookmarks) => {
            sendResponse({
              bookmarks: bookmarks.map((bookmark) => ({
                id: bookmark.id,
                url: bookmark.url || "",
                title: bookmark.title || "",
                parentId: bookmark.parentId,
              })),
            });
          });
          break;

        case "downloads":
          browser.downloads.search({ state: "complete" }, (downloads) => {
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

            sendResponse({
              downloads: [...matchingDownloads, ...nonMatchingDownloads].map(
                (download) => ({
                  id: download.id,
                  url: download.url || "",
                  filename: download.filename
                    ? download.filename.split(/[/\\]/).pop() || ""
                    : "",
                  state: download.state,
                  startTime: download.startTime,
                  finalUrl: download.finalUrl || "",
                  isMatch: matchingDownloads.includes(download),
                })
              ),
            });
          });
          break;
      }

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
