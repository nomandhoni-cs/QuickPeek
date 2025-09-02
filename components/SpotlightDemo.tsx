// SpotlightDemo.tsx - Updated for dark theme
import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, ClockIcon, BookmarkIcon, GlobeAltIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

const SpotlightDemo = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    const demoTexts = [
        "YouTube React tutorial",
        "Gmail inbox",
        "GitHub pull requests",
        "Weather forecast",
        "localhost:3000"
    ];

    const searchResults = [
        { type: "tab", icon: GlobeAltIcon, title: "YouTube - React Tutorial", subtitle: "Currently open in Tab 3", color: "text-blue-400" },
        { type: "history", icon: ClockIcon, title: "React Documentation", subtitle: "Visited 2 hours ago", color: "text-purple-400" },
        { type: "bookmark", icon: BookmarkIcon, title: "React Best Practices", subtitle: "Bookmarked last week", color: "text-yellow-400" },
        { type: "download", icon: DocumentIcon, title: "react-guide.pdf", subtitle: "Downloaded yesterday", color: "text-green-400" },
        { type: "search", icon: MagnifyingGlassIcon, title: "Search web for:", subtitle: searchText, color: "text-lime-400" },
    ];

    useEffect(() => {
        const sequence = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsOpen(true);
            await new Promise(resolve => setTimeout(resolve, 500));

            let textIndex = 0;
            let charIndex = 0;

            const typeChar = () => {
                const currentText = demoTexts[textIndex];
                if (charIndex <= currentText.length) {
                    setSearchText(currentText.substring(0, charIndex));
                    setIsTyping(charIndex < currentText.length);
                    charIndex++;
                    setTimeout(typeChar, 100);
                } else {
                    setIsTyping(false);
                    setTimeout(() => {
                        charIndex = currentText.length;
                        const clearChar = () => {
                            if (charIndex >= 0) {
                                setSearchText(currentText.substring(0, charIndex));
                                charIndex--;
                                setTimeout(clearChar, 50);
                            } else {
                                textIndex = (textIndex + 1) % demoTexts.length;
                                charIndex = 0;
                                setTimeout(typeChar, 500);
                            }
                        };
                        setTimeout(clearChar, 2000);
                    }, 1000);
                }
            };

            typeChar();
        };

        sequence();

        const navInterval = setInterval(() => {
            if (searchText) {
                setSelectedIndex(prev => (prev + 1) % 5);
            }
        }, 2000);

        return () => clearInterval(navInterval);
    }, []);

    return (
        <div className="relative">
            {/* Demo Container */}
            <div className="relative p-8 min-h-[600px] flex items-center justify-center">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-green-500 to-lime-500 text-black text-xs font-bold rounded-full shadow-lg animate-pulse">
                        LIVE DEMO
                    </span>
                </div>

                {/* Keyboard Hint */}
                <div className="absolute top-0 right-0 flex items-center space-x-2">
                    <kbd className="px-3 py-1 bg-gray-800 text-green-400 rounded-lg text-xs font-mono shadow-lg border border-gray-700">
                        {navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}
                    </kbd>
                    <span className="text-gray-600">+</span>
                    <kbd className="px-3 py-1 bg-gray-800 text-green-400 rounded-lg text-xs font-mono shadow-lg border border-gray-700">
                        M
                    </kbd>
                </div>

                {/* Spotlight Interface */}
                <div className={`w-full transition-all duration-500 transform ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                    {/* Search Bar */}
                    <div className="bg-gray-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-800 overflow-hidden ring-1 ring-green-500/20">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-6 h-6 absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                value={searchText}
                                readOnly
                                placeholder="Search tabs, history, bookmarks, or enter a URL..."
                                className="w-full px-14 py-5 bg-transparent text-lg text-gray-100 placeholder-gray-600 outline-none"
                            />
                            {isTyping && (
                                <div className="absolute right-5 top-1/2 transform -translate-y-1/2 w-0.5 h-5 bg-green-400 animate-pulse" />
                            )}
                        </div>

                        {/* Results */}
                        {searchText && (
                            <div className="border-t border-gray-800">
                                {searchResults.map((result, index) => {
                                    const Icon = result.icon;
                                    return (
                                        <div
                                            key={index}
                                            className={`px-5 py-3 flex items-center space-x-3 transition-all duration-200 ${selectedIndex === index
                                                ? 'bg-green-500/10 border-l-2 border-green-400'
                                                : 'hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${result.color}`} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-200">
                                                    {result.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {result.subtitle}
                                                </p>
                                            </div>
                                            {selectedIndex === index && (
                                                <ArrowRightIcon className="w-4 h-4 text-green-400 animate-pulse" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Navigation Hints */}
                    {searchText && (
                        <div className="flex items-center justify-center mt-4 space-x-4 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">↑↓</kbd>
                                <span>Navigate</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Enter</kbd>
                                <span>Select</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700">Esc</kbd>
                                <span>Close</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpotlightDemo;