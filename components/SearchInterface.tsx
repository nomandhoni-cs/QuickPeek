"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Command } from "cmdk"
import { motion, AnimatePresence } from "framer-motion"
import {
    Search,
    Calculator,
    ArrowUp,
    ArrowDown,
    CornerDownLeft,
    X,
    SearchIcon,
    Link as LinkIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"

import { MENU_ITEMS, CATEGORIES } from "@/lib/menuItems"
import { calculateExpression, executeSearch, fetchSearchSuggestions, isValidUrl } from "@/lib/searchUtils"

// Update this import to your actual path
// import TrialRemaining from "@/components/trial-remaining"
declare const TrialRemaining: React.FC

export default function SearchInterface() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<string>("All")
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const tabs = useMemo(() => ["All", ...CATEGORIES], [])
    const calculationResult = useMemo(() => (search.trim() ? calculateExpression(search) : null), [search])
    const isUrl = useMemo(() => isValidUrl(search), [search])

    // Cmd/Ctrl + K toggle and Esc close
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsExpanded((prev) => !prev)
                setTimeout(() => inputRef.current?.focus(), 40)
            }
            if (e.key === "Escape" && isExpanded) {
                e.preventDefault()
                closeSearch()
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [isExpanded])

    // Type-to-open: open and insert first character when typing anywhere (except inputs)
    useEffect(() => {
        const isEditable = (el: EventTarget | null) => {
            const node = el as HTMLElement | null
            if (!node) return false
            const tag = node.tagName?.toLowerCase()
            if (tag === "input" || tag === "textarea" || tag === "select") return true
            if (node.isContentEditable) return true
            return false
        }

        const onKeydown = (e: KeyboardEvent) => {
            if (isExpanded) return
            if (e.metaKey || e.ctrlKey || e.altKey) return
            if (isEditable(e.target)) return

            if (e.key.length === 1) {
                setIsExpanded(true)
                setSearch(e.key)
                requestAnimationFrame(() => inputRef.current?.focus())
            } else if (e.key === "Backspace") {
                setIsExpanded(true)
                setSearch("")
                requestAnimationFrame(() => inputRef.current?.focus())
            }
        }

        document.addEventListener("keydown", onKeydown)
        return () => document.removeEventListener("keydown", onKeydown)
    }, [isExpanded])

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded) {
            const t = setTimeout(() => inputRef.current?.focus(), 50)
            return () => clearTimeout(t)
        }
    }, [isExpanded])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isExpanded && containerRef.current && !containerRef.current.contains(event.target as Node)) {
                closeSearch()
            }
        }
        if (isExpanded) document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [isExpanded])

    // Suggestions (debounced)
    useEffect(() => {
        const id = setTimeout(async () => {
            if (search.trim() && !calculationResult && !isUrl && isExpanded) {
                setIsLoadingSuggestions(true)
                const results = await fetchSearchSuggestions(search)
                setSuggestions(results)
                setIsLoadingSuggestions(false)
            } else {
                setSuggestions([])
            }
        }, 260)
        return () => clearTimeout(id)
    }, [search, calculationResult, isUrl, isExpanded])

    const handleExecuteSearch = useCallback(
        async (value: string) => {
            await executeSearch(value)
            closeSearch()
        },
        []
    )

    const handleItemSelect = useCallback((callback: () => void) => {
        callback()
        closeSearch()
    }, [])

    const closeSearch = useCallback(() => {
        setIsExpanded(false)
        setSearch("")
        setSuggestions([])
    }, [])

    const filteredItems =
        selectedCategory === "All"
            ? MENU_ITEMS
            : MENU_ITEMS.filter((item) => item.category === selectedCategory)

    // Left/Right category switching when NOT in the input
    const handleRootKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const isInput = (e.target as HTMLElement)?.getAttribute("cmdk-input") !== null
        if (!isInput && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            e.preventDefault()
            const idx = tabs.indexOf(selectedCategory)
            if (e.key === "ArrowLeft") {
                setSelectedCategory(tabs[Math.max(0, idx - 1)])
            } else {
                setSelectedCategory(tabs[Math.min(tabs.length - 1, idx + 1)])
            }
        }
    }

    // Quick actions always first so Enter has a good default
    const quickActions = useMemo(() => {
        if (!search.trim()) return []
        const items: {
            id: string
            label: string
            icon: React.ReactNode
            onSelect: () => void
            value: string
            keywords?: string[]
        }[] = []

        if (calculationResult) {
            items.push({
                id: "qa-copy",
                label: `Copy result: ${calculationResult}`,
                icon: <Calculator className="w-4 h-4 text-primary" />,
                onSelect: () => {
                    navigator.clipboard.writeText(calculationResult)
                },
                value: `copy result ${calculationResult}`,
                keywords: ["copy", "result", "calc", "calculator"],
            })
        }

        if (isUrl) {
            const target = search.includes("://") ? search : `https://${search}`
            items.push({
                id: "qa-open-url",
                label: `Open ${target}`,
                icon: <LinkIcon className="w-4 h-4 text-green-600" />,
                onSelect: () => window.open(target, "_blank"),
                value: `open url ${target}`,
                keywords: ["open", "url", "link"],
            })
        }

        // Default search
        items.push({
            id: "qa-search",
            label: `Search "${search.trim()}"`,
            icon: <Search className="w-4 h-4" />,
            onSelect: () => handleExecuteSearch(search),
            value: `search ${search.trim()}`,
            keywords: ["search", "query"],
        })

        return items
    }, [calculationResult, handleExecuteSearch, isUrl, search])

    return (
        <>
            {/* Backdrop Overlay */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        key="overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeSearch}
                    />
                )}
            </AnimatePresence>

            {/* Center horizontally wherever placed */}
            <div className="w-full px-4">
                <div
                    ref={containerRef}
                    className="relative mx-auto w-full max-w-3xl 2xl:max-w-4xl"
                    onKeyDown={handleRootKeyDown}
                >
                    <Command className="bg-card border rounded-2xl shadow-2xl overflow-hidden">
                        {/* Always show TrialRemaining above the search */}
                        <div className="px-4 pt-3">
                            <TrialRemaining />
                        </div>

                        {/* Input Row */}
                        <div className="relative border-t border-b border-border/50">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                            <Command.Input
                                ref={inputRef}
                                value={search}
                                onValueChange={(v) => {
                                    setSearch(v)
                                    if (!isExpanded) setIsExpanded(true)
                                }}
                                onFocus={() => setIsExpanded(true)}
                                placeholder="Search anything or calculate..."
                                className="w-full pl-12 pr-12 py-4 text-lg bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
                            />
                            <AnimatePresence mode="wait">
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.08, ease: "easeInOut" }}
                                        className="absolute right-2 top-2 -translate-y-1/2"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={closeSearch}
                                            className="h-8 w-8"
                                            aria-label="Close"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Expandable content with FIXED height */}
                        <AnimatePresence mode="wait">
                            {isExpanded && (
                                <motion.div
                                    key="content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{
                                        height: {
                                            type: "spring",
                                            damping: 30,
                                            stiffness: 400,
                                            mass: 0.8
                                        },
                                        opacity: { duration: 0.1, ease: "easeInOut" },
                                    }}
                                    className="overflow-hidden"
                                >
                                    {/* Calculator banner */}
                                    {calculationResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.1, ease: "easeOut" }}
                                        >
                                            <div className="px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Calculator className="w-4 h-4 text-primary" />
                                                        <span className="text-sm text-muted-foreground">Result:</span>
                                                        <span className="font-mono text-lg font-semibold text-primary">{calculationResult}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">Enter runs selected item</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* URL banner */}
                                    {isUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.1, ease: "easeOut" }}
                                        >
                                            <div className="px-4 py-3 border-b bg-gradient-to-r from-emerald-500/10 to-green-500/5">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-green-600 dark:text-green-400">🌐</span>
                                                    <span className="text-sm text-green-700 dark:text-green-300">
                                                        Enter will open the selected action (e.g., Open URL)
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Tabs with horizontal ScrollArea */}
                                    <div className="border-b bg-muted/30">
                                        <ScrollArea className="w-full">
                                            <div className="px-4 py-3 flex gap-2">
                                                {tabs.map((cat, i) => (
                                                    <motion.button
                                                        key={cat}
                                                        initial={{ opacity: 0, x: -4 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{
                                                            delay: i * 0.015,
                                                            duration: 0.08,
                                                            ease: "easeOut"
                                                        }}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-100 whitespace-nowrap ${selectedCategory === cat
                                                            ? "bg-primary text-primary-foreground shadow"
                                                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                                            }`}
                                                    >
                                                        {cat}
                                                    </motion.button>
                                                ))}
                                            </div>
                                            <ScrollBar orientation="horizontal" />
                                        </ScrollArea>
                                    </div>

                                    {/* FIXED HEIGHT Content list with ScrollArea */}
                                    <ScrollArea className="h-[250px]">
                                        <div className="p-2">
                                            <Command.List>
                                                <Command.Empty>
                                                    <div className="py-12 text-center">
                                                        <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                                                        <p className="text-muted-foreground">No results found.</p>
                                                    </div>
                                                </Command.Empty>

                                                {/* Quick actions */}
                                                {search.trim() && (
                                                    <Command.Group heading="Quick actions">
                                                        {quickActions.map((qa, index) => (
                                                            <motion.div
                                                                key={qa.id}
                                                                initial={{ opacity: 0, x: -8 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{
                                                                    delay: index * 0.015,
                                                                    duration: 0.08,
                                                                    ease: "easeOut"
                                                                }}
                                                            >
                                                                <Command.Item
                                                                    value={qa.value}
                                                                    keywords={qa.keywords}
                                                                    onSelect={() => {
                                                                        qa.onSelect()
                                                                        closeSearch()
                                                                    }}
                                                                    className="flex items-center gap-3 px-4 py-3 rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer transition-colors duration-100"
                                                                >
                                                                    <span className="text-muted-foreground flex-shrink-0">{qa.icon}</span>
                                                                    <span className="flex-1">{qa.label}</span>
                                                                </Command.Item>
                                                            </motion.div>
                                                        ))}
                                                    </Command.Group>
                                                )}

                                                {/* Suggestions loading skeleton */}
                                                {isLoadingSuggestions && (
                                                    <Command.Loading>
                                                        <div className="px-4 py-2">
                                                            <div className="space-y-2">
                                                                {Array.from({ length: 4 }).map((_, i) => (
                                                                    <div key={`sk-${i}`} className="flex items-center gap-3">
                                                                        <Skeleton className="h-4 w-4 rounded" />
                                                                        <Skeleton className="h-4 w-48" />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </Command.Loading>
                                                )}

                                                {/* Search Suggestions */}
                                                {!isLoadingSuggestions && suggestions.length > 0 && (
                                                    <Command.Group heading="Search Suggestions">
                                                        {suggestions.map((s, index) => (
                                                            <motion.div
                                                                key={`sugg-${index}`}
                                                                initial={{ opacity: 0, x: -8 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{
                                                                    delay: index * 0.015,
                                                                    duration: 0.08,
                                                                    ease: "easeOut"
                                                                }}
                                                            >
                                                                <Command.Item
                                                                    value={s}
                                                                    onSelect={() => handleExecuteSearch(s)}
                                                                    className="flex items-center gap-3 px-4 py-3 rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer transition-colors duration-100"
                                                                >
                                                                    <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                                    <span className="flex-1">{s}</span>
                                                                    <span className="text-xs text-muted-foreground">Search</span>
                                                                </Command.Item>
                                                            </motion.div>
                                                        ))}
                                                    </Command.Group>
                                                )}

                                                {/* Menu Items */}
                                                {selectedCategory === "All"
                                                    ? tabs
                                                        .filter((c) => c !== "All")
                                                        .map((cat) => {
                                                            const items = MENU_ITEMS.filter((it) => it.category === cat)
                                                            if (items.length === 0) return null
                                                            return (
                                                                <Command.Group key={cat} heading={cat}>
                                                                    {items.map((item, index) => (
                                                                        <CommandMenuItem
                                                                            key={item.id}
                                                                            item={item}
                                                                            index={index}
                                                                            onSelect={handleItemSelect}
                                                                        />
                                                                    ))}
                                                                </Command.Group>
                                                            )
                                                        })
                                                    : (
                                                        <Command.Group heading={selectedCategory}>
                                                            {filteredItems.map((item, index) => (
                                                                <CommandMenuItem
                                                                    key={item.id}
                                                                    item={item}
                                                                    index={index}
                                                                    onSelect={handleItemSelect}
                                                                />
                                                            ))}
                                                        </Command.Group>
                                                    )}
                                            </Command.List>
                                        </div>
                                        <ScrollBar orientation="vertical" />
                                    </ScrollArea>

                                    {/* Footer */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.1, ease: "easeOut" }}
                                        className="border-t px-4 py-2.5 bg-muted/30 flex justify-between items-center text-xs text-muted-foreground"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <SearchIcon className="h-4 w-4 text-emerald-500" />
                                            <span className="font-medium">QuickPeek</span>
                                        </div>
                                        <div className="hidden lg:flex items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <ArrowUp className="w-3 h-3" />
                                                <ArrowDown className="w-3 h-3" />
                                                <span>Navigate</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span>←→</span>
                                                <span>Switch tabs</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <CornerDownLeft className="w-3 h-3" />
                                                <span>Enter to run</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Esc</kbd>
                                                <span>Close</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Command>
                </div>
            </div>
        </>
    )
}

// Item Component
function CommandMenuItem({
    item,
    index,
    onSelect,
}: {
    item: typeof MENU_ITEMS[number]
    index: number
    onSelect: (callback: () => void) => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
                delay: index * 0.015,
                duration: 0.08,
                ease: "easeOut"
            }}
        >
            <Command.Item
                value={`${item.label} ${item.keywords?.join(" ") || ""}`}
                keywords={item.keywords}
                onSelect={() => onSelect(item.action)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg aria-selected:bg-accent aria-selected:text-accent-foreground cursor-pointer transition-colors duration-100"
            >
                <div className="text-muted-foreground flex-shrink-0">{item.icon}</div>
                <span className="flex-1">{item.label}</span>
            </Command.Item>
        </motion.div>
    )
}