import React, { useEffect, useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon, DocumentIcon, ClockIcon, BookmarkIcon } from "@heroicons/react/24/solid";

type Result = {
    id: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
};

const ACCENT_VAR = "var(--accent)";

function Key({ label, pressed = false }: { label: string; pressed?: boolean }) {
    return (
        <kbd
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all
      ${pressed ? "scale-95 bg-[color:rgba(255,255,255,0.18)]" : "bg-white/10"}
      border-white/10 text-zinc-100 shadow-sm`}
        >
            {label}
        </kbd>
    );
}

function isMac(): boolean {
    if (typeof navigator === "undefined") return false;
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

export default function QuickPeekDemo() {
    const [pressed, setPressed] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const timeouts = useRef<number[]>([]);
    const prefersReducedMotion = useRef(
        typeof window !== "undefined" && window.matchMedia
            ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
            : false
    );

    const results: Result[] = useMemo(
        () => [
            {
                id: "tabs",
                icon: <DocumentIcon className="w-5 h-5 text-zinc-400" />,
                title: "Tabs • 'Docs – Project overview'",
                subtitle: "chrome://tabs",
            },
            {
                id: "history",
                icon: <ClockIcon className="w-5 h-5 text-zinc-400" />,
                title: "History • 'Documentation shortcuts'",
                subtitle: "Visited 2 days ago",
            },
            {
                id: "bookmarks",
                icon: <BookmarkIcon className="w-5 h-5 text-zinc-400" />,
                title: "Bookmarks • 'QuickPeek Docs'",
                subtitle: "bookmarks://",
            },
        ],
        []
    );

    function clearAllTimers() {
        timeouts.current.forEach((t) => clearTimeout(t));
        timeouts.current = [];
    }

    function schedule(fn: () => void, ms: number) {
        const id = window.setTimeout(fn, ms);
        timeouts.current.push(id);
    }

    function typeText(text: string, speed = 45) {
        let i = 0;
        const step = () => {
            setQuery(text.slice(0, i + 1));
            i++;
            if (i < text.length) {
                schedule(step, speed);
            }
        };
        step();
    }

    useEffect(() => {
        if (prefersReducedMotion.current) {
            setOpen(true);
            setQuery("history");
            setActiveIndex(1);
            return;
        }

        const cycle = () => {
            setPressed(true);
            schedule(() => {
                setPressed(false);
                setOpen(true);
                setQuery("");
                typeText("history");
            }, 320);
            schedule(() => setActiveIndex(1), 1400);
            schedule(() => setOpen(false), 3000);
            schedule(cycle, 4200);
        };

        cycle();
        return () => clearAllTimers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mac = isMac();

    return (
        <div className="relative w-full h-72 md:h-80">
            {/* Command palette container */}
            <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg
          rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl ring-1 ring-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.45)]
          transition-all duration-500
          ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
            >
                {/* Input */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-zinc-400" />
                    <input
                        value={query}
                        readOnly
                        className="w-full bg-transparent outline-none placeholder-zinc-500 text-zinc-100"
                        placeholder="Search everything…"
                    />
                    <span className="text-[10px] text-zinc-500">QuickPeek</span>
                </div>
                <div className="h-px bg-white/10" />

                {/* Results */}
                <ul className="py-2">
                    {results.map((r, idx) => (
                        <li
                            key={r.id}
                            className={`px-4 py-2 flex items-center gap-3 cursor-default transition-colors
                ${idx === activeIndex ? "bg-[color:rgba(34,197,94,0.15)]" : "hover:bg-white/5"}`}
                        >
                            {r.icon}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm text-zinc-100 truncate">{r.title}</div>
                                <div className="text-xs text-zinc-500 truncate">{r.subtitle}</div>
                            </div>
                            {idx === activeIndex && (
                                <span
                                    className="text-[10px] px-2 py-0.5 rounded-full"
                                    style={{ background: "rgba(34,197,94,0.2)", color: ACCENT_VAR as any }}
                                >
                                    Enter
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Keyboard hint */}
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Key label={mac ? "⌘" : "Ctrl"} pressed={pressed} />
                <span>+</span>
                <Key label="M" pressed={pressed} />
            </div>
        </div>
    );
}