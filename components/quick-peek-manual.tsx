import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import SearchEngineSelector from "./SearchEngineSelector";
import logo from "/icon/128.png";
export default function QuickPeekManual() {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 w-full h-screen">
      <div className="flex items-center">
        <img src={logo} alt="QuickPeek Logo" className="app-logo w-10 h-10" />{" "}
        <h1 className="text-4xl -ml-1 font-bold text-[#32CD32]">
          uickPeek just got better!
        </h1>
      </div>
      <div>
        <div className="relative">
          <MagnifyingGlassIcon className=" w-10 h-10 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pr-4" />
          <input
            type="text"
            placeholder="Search tabs, history, bookmarks, downloads, or enter a URL or search anything on the web..."
            className="w-full p-4 pl-12 rounded-lg border-2 border-[#32CD32] focus:outline-none focus:ring-2 focus:ring-[#32CD32] focus:border-transparent text-sm"
          />
        </div>
      </div>
      <section>
        <h2 className="text-3xl font-semibold mb-4">How to Use QuickPeek</h2>
        <p className="text-3xl font-semibold text-center my-8 text-[#32CD32]">
          Turn on the extension or use the search bar on any page!
        </p>
      </section>
      <section>
        <h2 className="text-3xl font-semibold mb-2">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { os: "Windows", shortcut: "CTRL + M" },
            { os: "Mac", shortcut: "CMD + M" },
            { os: "Linux", shortcut: "CTRL + M" },
          ].map((item) => (
            <div
              key={item.os}
              className="rounded-lg shadow-md p-3 transition-all duration-300 hover:shadow-lg hover:scale-105 ring-2 ring-[#32CD32]"
            >
              <h3 className="text-xl font-medium mb-3 text-[#32CD32]">
                {item.os}
              </h3>
              <p className="text-2xl font-semibold">{item.shortcut}</p>
            </div>
          ))}
        </div>
      </section>
      <SearchEngineSelector />
      <ActivateLicense />
      <section>
        <h2 className="text-3xl font-semibold mb-4">Additional Information</h2>
        <p className="text-lg">
          QuickPeek is designed to enhance your browsing experience. Use the
          search bar above to find specific information in your tabs, history,
          bookmarks, and downloads, or to search the web directly. Activate the
          extension quickly using the keyboard shortcuts provided above.
        </p>
      </section>
    </div>
  );
}
