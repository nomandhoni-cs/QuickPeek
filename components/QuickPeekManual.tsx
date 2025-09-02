// QuickPeekManual.tsx
import SearchEngineSelector from "./SearchEngineSelector";
import ActivateLicense from "./ActivateLicense";
import SpotlightDemo from "./SpotlightDemo";
import logo from "/icon/128.png";
import { SparklesIcon, ShieldCheckIcon } from "@heroicons/react/24/solid";

export default function QuickPeekManual() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-400/10 rounded-full filter blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-lime-500/10 rounded-full filter blur-2xl animate-pulse delay-500" />
      </div>

      {/* Main Layout Container */}
      <div className="relative min-h-screen w-full p-8 flex flex-col">

        {/* Header - Top Center */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 animate-fade-in mb-4">
            <img src={logo} alt="QuickPeek Logo" className="w-12 h-12" />
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-green-400 to-lime-400 bg-clip-text text-transparent">QuickPeek</span>
              <span className="text-gray-400 font-light ml-2">just got better!</span>
            </h1>
          </div>

          {/* Universal Access Banner */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-lime-500/20 blur-xl"></div>
            <div className="relative bg-gradient-to-r from-green-500/10 to-lime-500/10 border border-green-500/30 rounded-2xl px-8 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-green-400 animate-pulse" />
                <p className="text-lg font-semibold">
                  <span className="text-green-400">Works on ANY website!</span>
                  <span className="text-gray-300 ml-2">Just press</span>
                  <kbd className="mx-2 px-3 py-1 bg-gray-800 rounded-lg text-sm font-mono text-green-400 border border-gray-700">
                    {navigator.platform.includes("Mac") ? "⌘ + M" : "Ctrl + M"}
                  </kbd>
                  <span className="text-gray-300">anywhere, anytime</span>
                </p>
                <SparklesIcon className="w-6 h-6 text-green-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-12 gap-6 max-w-[1920px] mx-auto w-full">

          {/* Left Column - How to Use */}
          <div className="col-span-3 space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 hover:border-green-500/30 transition-all duration-300">
              <h2 className="text-2xl font-bold mb-4 text-green-400">How to Use</h2>
              <div className="space-y-4">
                {[
                  "Press shortcut to activate",
                  "Type to search anywhere",
                  "Navigate with arrow keys",
                  "Press Enter to select"
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-green-400 font-bold">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-400">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 hover:border-green-500/30 transition-all duration-300">
              <h3 className="text-xl font-bold mb-4 text-green-400">Shortcuts</h3>
              <div className="space-y-3">
                {[
                  { os: "Windows", key: "CTRL + M", icon: "⊞" },
                  { os: "Mac", key: "⌘ + M", icon: "⌘" },
                  { os: "Linux", key: "CTRL + M", icon: "🐧" },
                ].map((item) => (
                  <div key={item.os} className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{item.os}</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded-lg text-xs font-mono text-green-400 border border-gray-700">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Get Pro CTA */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-lime-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-gradient-to-r from-green-500/20 to-lime-500/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/50 hover:border-green-400 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-bold text-green-400">Get Pro License</h3>
                </div>
                <p className="text-xs text-gray-400 mb-4">Unlock all features and support development</p>
                <a
                  href="https://blinkeye.lemonsqueezy.com/buy/fdb56430-a71d-4f25-9bd5-08ca19d29298"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 px-4 bg-gradient-to-r from-green-500 to-lime-500 text-black font-bold rounded-lg text-center hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105 transition-all duration-300"
                >
                  Buy License →
                </a>
                <p className="text-xs text-gray-500 mt-3 text-center">One-time purchase • Lifetime updates</p>
              </div>
            </div>
          </div>

          {/* Center - Spotlight Demo */}
          <div className="col-span-6 flex items-center justify-center relative">
            <div className="w-full max-w-2xl">
              <SpotlightDemo />
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gray-900/90 backdrop-blur-xl rounded-full px-6 py-2 border border-gray-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Try the demo above • Works everywhere on the web</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-3 space-y-6">
            {/* Search Engines */}
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 hover:border-green-500/30 transition-all duration-300">
              <SearchEngineSelector />
            </div>

            {/* License */}
            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 hover:border-green-500/30 transition-all duration-300">
              <ActivateLicense />
            </div>
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Search tabs, history, bookmarks, and downloads instantly • Your productivity companion
          </p>
          <p className="text-xs text-gray-600">
            💡 Pro tip: QuickPeek works on every website - YouTube, Gmail, GitHub, Twitter, and more!
          </p>
        </div>
      </div>
    </div>
  );
}