"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import {
    Search,
    Calculator,
    ArrowUp,
    ArrowDown,
    CornerDownLeft,
    Grid3X3,
    X,
    SearchIcon,
    Download,
} from "lucide-react"
import { SiGooglekeep, SiGooglecalendar, SiGooglemeet, SiGmail } from '@icons-pack/react-simple-icons';
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { handleSearch } from "@/lib/searchUrl";

interface MenuItem {
    id: string
    label: string
    icon: React.ReactNode
    action: () => void
    category?: string
    shortcutText?: string
}

interface Tab {
    id: string
    label: string
    items: MenuItem[]
}

interface SearchSuggestion {
    id: string
    query: string
    type: "suggestion"
}

interface AllTabItem {
    type: "suggestion" | "category" | "item"
    id: string
    label: string
    icon?: React.ReactNode
    action?: () => void
    category?: string
}

export default function SearchInterface() {
    const [isExpanded, setIsExpanded] = useState(false)
    const [searchValue, setSearchValue] = useState("")
    const [selectedTabIndex, setSelectedTabIndex] = useState(0)
    const [selectedItemIndex, setSelectedItemIndex] = useState(-1)
    const [calculationResult, setCalculationResult] = useState<string | null>(null)
    const [isNavigatingTabs, setIsNavigatingTabs] = useState(false)
    const [isFocusedOnSearch, setIsFocusedOnSearch] = useState(false)
    const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([])
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

    const searchInputRef = useRef<HTMLInputElement>(null)
    const dialogSearchInputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const menuItemsRef = useRef<(HTMLDivElement | null)[]>([])
    const tabsRef = useRef<(HTMLDivElement | null)[]>([])
    const menuContainerRef = useRef<HTMLDivElement>(null)

    const baseTabs: Tab[] = [
        {
            id: "utilities",
            label: "Utilities",
            items: [
                {
                    id: "home",
                    label: "Open Downloads",
                    icon: <Download className="w-4 h-4" />,
                    action: () => { browser.tabs.create({ url: 'chrome://downloads' }) },
                    category: "Utilities",
                    shortcutText: "",
                },
            ],
        },
        {
            id: "appShortcuts", // Changed from "shortcuts" to be more descriptive
            label: "App Actions & Shortcuts", // Changed from "Shortcuts"
            items: [
                // --- Google Suite ---
                {
                    id: "google-keep-new",
                    label: "Create New Google Keep Note",
                    icon: <SiGooglekeep color="#FFBB00" className="w-4 h-4" />,
                    action: () => { window.open('https://note.new', '_blank'); },
                    category: "Google Suite",
                    shortcutText: "",
                },
                {
                    id: "google-calendar-new",
                    label: "Create New Google Calendar Event",
                    icon: <SiGooglecalendar color="#4285F4" className="w-4 h-4" />,
                    action: () => { window.open('https://cal.new', '_blank'); },
                    category: "Google Suite",
                    shortcutText: "",
                },
                {
                    id: "google-meet-new",
                    label: "Start a New Google Meet",
                    icon: <SiGooglemeet color="#00897B" className="w-4 h-4" />,
                    action: () => { window.open('https://meet.new', '_blank'); },
                    category: "Google Suite",
                    shortcutText: "",
                },
                {
                    id: "gmail-compose",
                    label: "Compose New Gmail",
                    icon: <SiGmail color="#EA4335" className="w-4 h-4" />,
                    action: () => { window.open('https://mail.google.com/mail/?view=cm&fs=1', '_blank'); },
                    category: "Google Suite",
                    shortcutText: "",
                },
                // {
                //     id: "google-docs-new",
                //     label: "Create New Google Doc",
                //     icon: "GoogleDocsIcon",
                //     action: () => { window.open('https://doc.new', '_blank'); },
                //     category: "Google Suite",
                // },
                // {
                //     id: "google-sheets-new",
                //     label: "Create New Google Sheet",
                //     icon: "GoogleSheetsIcon",
                //     action: () => { window.open('https://sheet.new', '_blank'); },
                //     category: "Google Suite",
                // },
                // {
                //     id: "google-slides-new",
                //     label: "Create New Google Slides",
                //     icon: "GoogleSlidesIcon",
                //     action: () => { window.open('https://slide.new', '_blank'); },
                //     category: "Google Suite",
                // },
                // {
                //     id: "google-forms-new",
                //     label: "Create New Google Form",
                //     icon: "GoogleFormsIcon",
                //     action: () => { window.open('https://form.new', '_blank'); },
                //     category: "Google Suite",
                // },

                // // --- Microsoft Office 365 / Web ---
                // {
                //     id: "outlook-compose",
                //     label: "Compose New Outlook Email (Web)",
                //     icon: "OutlookIcon",
                //     // Choose one or provide logic to pick based on user account type
                //     action: () => { window.open('https://outlook.office.com/mail/deeplink/compose', '_blank'); /* or outlook.live.com for personal */ },
                //     category: "Microsoft Office",
                // },
                // {
                //     id: "ms-todo-open",
                //     label: "Open Microsoft To Do (Web)",
                //     icon: "MicrosoftToDoIcon",
                //     action: () => { window.open('https://to-do.office.com/tasks/today', '_blank'); },
                //     category: "Microsoft Office",
                // },
                // {
                //     id: "ms-word-new",
                //     label: "Create New Word Document (Web)",
                //     icon: "WordIcon",
                //     action: () => { window.open('https://www.office.com/launch/word?auth=1&from=Shellprod&New=1', '_blank'); }, // More reliable link
                //     category: "Microsoft Office",
                // },
                // {
                //     id: "ms-excel-new",
                //     label: "Create New Excel Spreadsheet (Web)",
                //     icon: "ExcelIcon",
                //     action: () => { window.open('https://www.office.com/launch/excel?auth=1&from=Shellprod&New=1', '_blank'); },
                //     category: "Microsoft Office",
                // },
                // {
                //     id: "ms-powerpoint-new",
                //     label: "Create New PowerPoint Presentation (Web)",
                //     icon: "PowerPointIcon",
                //     action: () => { window.open('https://www.office.com/launch/powerpoint?auth=1&from=Shellprod&New=1', '_blank'); },
                //     category: "Microsoft Office",
                // },

                // // --- Project Management & Collaboration ---
                // {
                //     id: "jira-create-issue",
                //     label: "Create Issue in Jira",
                //     icon: "JiraIcon",
                //     action: () => {
                //         const jiraDomain = prompt("Enter your Jira domain (e.g., yourcompany.atlassian.net):");
                //         if (jiraDomain) {
                //             window.open(`https://${jiraDomain}/secure/CreateIssue.jspa`, '_blank');
                //         }
                //     },
                //     category: "Project Management",
                // },
                // {
                //     id: "trello-new-board",
                //     label: "Create New Trello Board",
                //     icon: "TrelloIcon",
                //     action: () => { window.open('https://trello.com/boards/new', '_blank'); },
                //     category: "Project Management",
                // },
                // {
                //     id: "asana-new-task",
                //     label: "Create New Asana Task",
                //     icon: "AsanaIcon",
                //     action: () => { window.open('https://app.asana.com/0/add-task', '_blank'); },
                //     category: "Project Management",
                // },
                // {
                //     id: "notion-new-page",
                //     label: "Create New Notion Page",
                //     icon: "NotionIcon",
                //     action: () => { window.open('https://notion.new', '_blank'); },
                //     category: "Collaboration",
                // },
                // {
                //     id: "slack-open",
                //     label: "Open Slack (Web)",
                //     icon: "SlackIcon",
                //     action: () => { window.open('https://app.slack.com/', '_blank'); },
                //     category: "Collaboration",
                // },

                // // --- Other Productivity & Utilities ---
                // {
                //     id: "todoist-add-task",
                //     label: "Add Task to Todoist",
                //     icon: "TodoistIcon",
                //     action: () => { window.open('https://todoist.com/add', '_blank'); },
                //     category: "Productivity",
                // },
                // {
                //     id: "icloud-reminders",
                //     label: "Open iCloud Reminders",
                //     icon: "AppleRemindersIcon",
                //     action: () => { window.open('https://www.icloud.com/reminders/', '_blank'); },
                //     category: "Productivity",
                // }
            ]
        },
        // {
        //     id: "files",
        //     label: "Files",
        //     items: [
        //         {
        //             id: "search-files",
        //             label: "Search Files",
        //             icon: <FileText className="w-4 h-4" />,
        //             action: () => console.log("Searching files..."),
        //             category: "Files",
        //         },
        //         {
        //             id: "recent-files",
        //             label: "Recent Files",
        //             icon: <Clock className="w-4 h-4" />,
        //             action: () => console.log("Opening recent files..."),
        //             category: "Files",
        //         },
        //         {
        //             id: "bookmarks",
        //             label: "Bookmarks",
        //             icon: <Bookmark className="w-4 h-4" />,
        //             action: () => console.log("Opening bookmarks..."),
        //             category: "Files",
        //         },
        //     ],
        // },
        // {
        //     id: "settings",
        //     label: "Settings",
        //     items: [
        //         {
        //             id: "preferences",
        //             label: "Preferences",
        //             icon: <Settings className="w-4 h-4" />,
        //             action: () => console.log("Opening preferences..."),
        //             category: "Settings",
        //         },
        //         {
        //             id: "profile",
        //             label: "View Profile",
        //             icon: <User className="w-4 h-4" />,
        //             action: () => console.log("Opening profile..."),
        //             category: "Settings",
        //         },
        //     ],
        // },
    ]

    // Create tabs with "All" tab first
    const tabs: Tab[] = [
        {
            id: "all",
            label: "All",
            items: [], // Will be populated dynamically
        },
        ...baseTabs,
    ]

    // Calculate arithmetic expressions safely without eval
    const calculateExpression = (expression: string): string | null => {
        try {
            const cleanExpression = expression.replace(/\s/g, "")

            // Only allow basic arithmetic operations and numbers
            if (!/^[\d+\-*/().]+$/.test(cleanExpression)) {
                return null
            }

            // Check for invalid patterns
            if (
                cleanExpression.includes("//") ||
                cleanExpression.includes("**") ||
                cleanExpression.includes("++") ||
                cleanExpression.includes("--")
            ) {
                return null
            }

            // Validate parentheses
            let parenCount = 0
            for (const char of cleanExpression) {
                if (char === "(") parenCount++
                if (char === ")") parenCount--
                if (parenCount < 0) return null
            }
            if (parenCount !== 0) return null

            // Parse and evaluate the expression safely
            const result = safeEvaluate(cleanExpression)

            if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
                // Format the result to handle floating point precision
                return Number.isInteger(result) ? result.toString() : Number.parseFloat(result.toFixed(10)).toString()
            }
            return null
        } catch {
            return null
        }
    }

    // Safe expression evaluator without eval
    const safeEvaluate = (expr: string): number => {
        // Remove spaces
        expr = expr.replace(/\s/g, "")

        // Handle parentheses first
        while (expr.includes("(")) {
            const start = expr.lastIndexOf("(")
            const end = expr.indexOf(")", start)
            if (end === -1) throw new Error("Mismatched parentheses")

            const subExpr = expr.substring(start + 1, end)
            const subResult = safeEvaluate(subExpr)
            expr = expr.substring(0, start) + subResult + expr.substring(end + 1)
        }

        // Handle multiplication and division (left to right)
        while (expr.match(/[\d.]+[*/][\d.]+/)) {
            expr = expr.replace(/(\d+\.?\d*)\s*([*/])\s*(\d+\.?\d*)/, (match, a, op, b) => {
                const numA = Number.parseFloat(a)
                const numB = Number.parseFloat(b)
                if (op === "*") return (numA * numB).toString()
                if (op === "/") {
                    if (numB === 0) throw new Error("Division by zero")
                    return (numA / numB).toString()
                }
                return match
            })
        }

        // Handle addition and subtraction (left to right)
        while (expr.match(/[\d.]+[+-][\d.]+/)) {
            expr = expr.replace(/(\d+\.?\d*)\s*([+-])\s*(\d+\.?\d*)/, (match, a, op, b) => {
                const numA = Number.parseFloat(a)
                const numB = Number.parseFloat(b)
                if (op === "+") return (numA + numB).toString()
                if (op === "-") return (numA - numB).toString()
                return match
            })
        }

        const result = Number.parseFloat(expr)
        if (isNaN(result)) throw new Error("Invalid expression")
        return result
    }

    // URL validation function
    const isValidUrl = (string: string): boolean => {
        const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
        return urlRegex.test(string.trim())
    }

    // Fetch search suggestions using DuckDuckGo
    const fetchSearchSuggestions = useCallback(async (query: string) => {
        if (!query.trim() || isValidUrl(query)) {
            setSearchSuggestions([])
            return
        }

        setIsLoadingSuggestions(true)
        try {
            // Using DuckDuckGo's autocomplete API
            const response = await fetch(`https://duckduckgo.com/ac/?q=${encodeURIComponent(query)}&type=list`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch suggestions")
            }

            const data = await response.json()

            // DuckDuckGo returns an array where the second element contains the suggestions
            const suggestionList = Array.isArray(data) && data.length > 1 ? data[1] : []

            const suggestions: SearchSuggestion[] = suggestionList
                .slice(0, 4) // Limit to 4 suggestions
                .map((suggestion: string, index: number) => ({
                    id: `suggestion-${index}`,
                    query: suggestion,
                    type: "suggestion" as const,
                }))

            setSearchSuggestions(suggestions)
        } catch (error) {
            console.error("Error fetching suggestions:", error)

            // Fallback to a simple local suggestion system if DuckDuckGo fails
            const fallbackSuggestions = generateFallbackSuggestions(query)
            setSearchSuggestions(fallbackSuggestions)
        } finally {
            setIsLoadingSuggestions(false)
        }
    }, [])

    // Fallback suggestion generator for when API fails
    const generateFallbackSuggestions = (query: string): SearchSuggestion[] => {
        const commonSuggestions = [`${query} tutorial`, `${query} guide`, `how to ${query}`, `${query} examples`]

        return commonSuggestions.slice(0, 4).map((suggestion, index) => ({
            id: `fallback-${index}`,
            query: suggestion,
            type: "suggestion" as const,
        }))
    }

    // Debounced search suggestions
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchValue.trim() && !calculationResult) {
                fetchSearchSuggestions(searchValue)
            } else {
                setSearchSuggestions([])
            }
        }, 300)

        return () => clearTimeout(timeoutId)
    }, [searchValue, calculationResult, fetchSearchSuggestions])

    // Handle search execution
    const executeSearch = (value: string) => {
        const trimmedValue = value.trim()

        if (isValidUrl(trimmedValue)) {
            const url = trimmedValue.includes("://") ? trimmedValue : `https://${trimmedValue}`
            window.open(url, "_blank")
        } else {
            console.log(trimmedValue)
            handleSearch(trimmedValue)
        }

        closeDialog()
    }

    // Close dialog and reset states
    const closeDialog = () => {
        setIsExpanded(false)
        setSelectedItemIndex(-1)
        setIsNavigatingTabs(false)
        setIsFocusedOnSearch(false)
    }

    // Update calculation result when search value changes
    useEffect(() => {
        if (searchValue.trim()) {
            const result = calculateExpression(searchValue)
            setCalculationResult(result)
        } else {
            setCalculationResult(null)
        }
    }, [searchValue])

    // Handle search input focus (opens dialog)
    const handleSearchFocus = () => {
        setIsExpanded(true)
        setSelectedItemIndex(-1)
        setIsNavigatingTabs(false)
        setIsFocusedOnSearch(true)
        // Focus the dialog search input after a brief delay
        setTimeout(() => {
            dialogSearchInputRef.current?.focus()
        }, 100)
    }

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value)
        // Ensure we're in search input mode when typing
        setIsFocusedOnSearch(true)
    }

    // Get current tab items or all items for "All" tab
    const getCurrentTabItems = (): AllTabItem[] => {
        if (selectedTabIndex === 0) {
            // "All" tab - combine suggestions and all items grouped by category
            const allItems: AllTabItem[] = []

            // Add search suggestions first
            if (searchSuggestions.length > 0) {
                searchSuggestions.forEach((suggestion) => {
                    allItems.push({
                        type: "suggestion",
                        id: suggestion.id,
                        label: suggestion.query,
                        icon: <Search className="w-4 h-4" />,
                        action: () => executeSearch(suggestion.query),
                    })
                })
            }

            // Add all items grouped by category
            baseTabs.forEach((tab) => {
                // Add category header
                allItems.push({
                    type: "category",
                    id: `category-${tab.id}`,
                    label: tab.label,
                    category: tab.label,
                })

                // Add items from this category
                tab.items.forEach((item) => {
                    allItems.push({
                        type: "item" as const,
                        id: item.id,
                        label: item.label,
                        icon: item.icon,
                        action: item.action,
                        category: tab.label,
                    })
                })
            })

            return allItems
        } else {
            // Regular tab - convert to AllTabItem format
            const currentTab = baseTabs[selectedTabIndex - 1]
            return (
                currentTab?.items.map((item) => ({
                    type: "item" as const,
                    id: item.id,
                    label: item.label,
                    icon: item.icon,
                    action: item.action,
                    category: item.category,
                })) || []
            )
        }
    }

    const currentTabItems = getCurrentTabItems()

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isExpanded) return

        switch (e.key) {
            case "Escape":
                closeDialog()
                break

            case "ArrowLeft":
                // Only prevent default and handle tab switching if NOT focused on search input
                if (!isFocusedOnSearch && (isNavigatingTabs || selectedItemIndex === -1)) {
                    e.preventDefault()
                    setIsNavigatingTabs(true)
                    if (selectedTabIndex > 0) {
                        setSelectedTabIndex(selectedTabIndex - 1)
                        setSelectedItemIndex(-1)
                    }
                }
                // If focused on search input, let the default behavior handle cursor movement
                break

            case "ArrowRight":
                // Only prevent default and handle tab switching if NOT focused on search input
                if (!isFocusedOnSearch && (isNavigatingTabs || selectedItemIndex === -1)) {
                    e.preventDefault()
                    setIsNavigatingTabs(true)
                    if (selectedTabIndex < tabs.length - 1) {
                        setSelectedTabIndex(selectedTabIndex + 1)
                        setSelectedItemIndex(-1)
                    }
                }
                // If focused on search input, let the default behavior handle cursor movement
                break

            case "ArrowDown":
                e.preventDefault()
                if (isFocusedOnSearch) {
                    // Move from search input to tabs
                    setIsFocusedOnSearch(false)
                    setIsNavigatingTabs(true)
                    setSelectedItemIndex(-1)
                    tabsRef.current[selectedTabIndex]?.focus()
                } else if (isNavigatingTabs) {
                    // Move from tabs to menu items
                    setIsNavigatingTabs(false)
                    setSelectedItemIndex(0)
                    menuItemsRef.current[0]?.focus()
                } else {
                    // Navigate through menu items (skip category headers)
                    let nextIndex = selectedItemIndex + 1
                    while (nextIndex < currentTabItems.length && currentTabItems[nextIndex].type === "category") {
                        nextIndex++
                    }
                    if (nextIndex < currentTabItems.length) {
                        setSelectedItemIndex(nextIndex)
                        menuItemsRef.current[nextIndex]?.focus()
                    }
                }
                break

            case "ArrowUp":
                e.preventDefault()
                if (selectedItemIndex > 0) {
                    // Find previous navigable item (skip category headers)
                    let prevIndex = selectedItemIndex - 1
                    while (prevIndex >= 0 && currentTabItems[prevIndex].type === "category") {
                        prevIndex--
                    }
                    if (prevIndex >= 0) {
                        setSelectedItemIndex(prevIndex)
                        menuItemsRef.current[prevIndex]?.focus()
                    } else {
                        // Go to tabs
                        setSelectedItemIndex(-1)
                        setIsNavigatingTabs(true)
                        tabsRef.current[selectedTabIndex]?.focus()
                    }
                } else if (selectedItemIndex === 0) {
                    // Go to tabs
                    setSelectedItemIndex(-1)
                    setIsNavigatingTabs(true)
                    tabsRef.current[selectedTabIndex]?.focus()
                } else if (isNavigatingTabs) {
                    // Go to search input from tabs
                    setIsNavigatingTabs(false)
                    setIsFocusedOnSearch(true)
                    dialogSearchInputRef.current?.focus()
                } else if (selectedItemIndex === -1 && !isNavigatingTabs && !isFocusedOnSearch) {
                    // Go to search input
                    setIsFocusedOnSearch(true)
                    dialogSearchInputRef.current?.focus()
                }
                break

            case "Tab":
                e.preventDefault()
                if (isFocusedOnSearch) {
                    // Move from search input to tabs
                    setIsFocusedOnSearch(false)
                    setIsNavigatingTabs(true)
                    setSelectedItemIndex(-1)
                    tabsRef.current[selectedTabIndex]?.focus()
                } else if (!isNavigatingTabs) {
                    // Move to tabs
                    setIsNavigatingTabs(true)
                    setSelectedItemIndex(-1)
                    tabsRef.current[selectedTabIndex]?.focus()
                } else {
                    // If already in tabs, go to first menu item
                    setIsNavigatingTabs(false)
                    setSelectedItemIndex(0)
                    menuItemsRef.current[0]?.focus()
                }
                break

            case "Enter":
                e.preventDefault()
                if (selectedItemIndex >= 0 && selectedItemIndex < currentTabItems.length) {
                    const selectedItem = currentTabItems[selectedItemIndex]
                    if (selectedItem.action && selectedItem.type !== "category") {
                        selectedItem.action()
                        closeDialog()
                    }
                } else if (calculationResult && isFocusedOnSearch) {
                    navigator.clipboard.writeText(calculationResult)
                    closeDialog()
                } else if (searchValue.trim() && isFocusedOnSearch) {
                    // Execute search or open URL when Enter is pressed on search input
                    executeSearch(searchValue)
                }
                break
        }
    }

    // Handle click outside dialog to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isExpanded && dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
                closeDialog()
            }
        }

        if (isExpanded) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isExpanded])

    // Handle menu item click
    const handleMenuItemClick = (item: AllTabItem, index: number) => {
        if (item.action && item.type !== "category") {
            setSelectedItemIndex(index)
            item.action()
            closeDialog()
        }
    }

    // Handle menu item hover
    const handleMenuItemHover = (index: number) => {
        if (currentTabItems[index].type !== "category") {
            setSelectedItemIndex(index)
            setIsNavigatingTabs(false)
            setIsFocusedOnSearch(false)
        }
    }

    // Handle tab click
    const handleTabClick = (index: number) => {
        setSelectedTabIndex(index)
        setSelectedItemIndex(-1)
        setIsNavigatingTabs(true)
        setIsFocusedOnSearch(false)
    }

    return (
        <div className=" flex items-center justify-center p-4 transition-colors">

            {/* Main Search Box */}
            <div ref={containerRef} className="w-full max-w-2xl 2xl:max-w-3xl">
                <TrialRemaining />
                <div className="bg-card border rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-out">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value=""
                            onFocus={handleSearchFocus}
                            placeholder="Search or calculate..."
                            className="w-full pl-12 pr-4 py-4 text-lg bg-transparent border-none outline-none rounded-xl text-foreground placeholder:text-muted-foreground cursor-pointer"
                            readOnly
                        />
                    </div>
                </div>
            </div>

            {/* Dialog Overlay */}
            {isExpanded && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]">
                    <div
                        ref={dialogRef}
                        className="w-full max-w-3xl  2xl:max-w-4xl mx-4 bg-card border rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
                    >
                        {/* Dialog Header with Search Input */}
                        <div className="relative border-b">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <input
                                ref={dialogSearchInputRef}
                                type="text"
                                value={searchValue}
                                onChange={handleSearchChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Search or calculate..."
                                className="w-full pl-12 pr-12 py-4 text-lg bg-transparent border-none outline-none rounded-t-xl text-foreground placeholder:text-muted-foreground"
                                autoFocus
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={closeDialog}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Dialog Content */}
                        <div>
                            {/* Calculator Result */}
                            {calculationResult && (
                                <div className="px-4 py-3 border-b bg-muted/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Calculator className="w-4 h-4 text-primary" />
                                            <span className="text-sm text-muted-foreground">Result:</span>
                                            <span className="font-mono text-lg font-semibold text-primary">{calculationResult}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Press Enter to copy</span>
                                    </div>
                                </div>
                            )}

                            {/* URL Detection Hint */}
                            {searchValue.trim() && isValidUrl(searchValue) && (
                                <div className="px-4 py-3 border-b bg-green-50 dark:bg-green-950/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-4 h-4 text-green-600 dark:text-green-400">🌐</div>
                                            <span className="text-sm text-green-700 dark:text-green-300">
                                                Press Enter to open: {searchValue.includes("://") ? searchValue : `https://${searchValue}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="px-4 py-3 border-b bg-muted/30">
                                <div className="flex space-x-2">
                                    {tabs.map((tab, index) => (
                                        <div
                                            key={tab.id}
                                            ref={(el) => (tabsRef.current[index] = el)}
                                            tabIndex={-1}
                                            onKeyDown={handleKeyDown}
                                        >
                                            <Badge
                                                variant={selectedTabIndex === index ? "default" : "secondary"}
                                                className={`cursor-pointer transition-all duration-150 ${selectedTabIndex === index && isNavigatingTabs
                                                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                    : ""
                                                    }`}
                                                onClick={() => handleTabClick(index)}
                                            >
                                                {tab.id === "all" && <Grid3X3 className="w-3 h-3 mr-1" />}
                                                {tab.label}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Menu Items - Fixed Height with Scroll */}
                            <div ref={menuContainerRef} className="max-h-64 overflow-y-auto">
                                <div className="py-2">
                                    {currentTabItems.map((item, index) => {
                                        if (item.type === "category") {
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/20 border-b"
                                                >
                                                    {item.label}
                                                </div>
                                            )
                                        }

                                        return (
                                            <div
                                                key={item.id}
                                                ref={(el) => (menuItemsRef.current[index] = el)}
                                                tabIndex={-1}
                                                className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${selectedItemIndex === index && !isNavigatingTabs && !isFocusedOnSearch
                                                    ? "bg-accent text-accent-foreground"
                                                    : "text-foreground hover:bg-accent/50"
                                                    }`}
                                                onClick={() => handleMenuItemClick(item, index)}
                                                onMouseEnter={() => handleMenuItemHover(index)}
                                                onKeyDown={handleKeyDown}
                                            >
                                                <div
                                                    className={`${selectedItemIndex === index && !isNavigatingTabs && !isFocusedOnSearch
                                                        ? "text-accent-foreground"
                                                        : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {item.icon}
                                                </div>
                                                <span className="flex-1">{item.label}</span>
                                                {item.type === "suggestion" && <span className="text-xs text-muted-foreground">Search</span>}
                                            </div>
                                        )
                                    })}

                                    {/* Loading suggestions in All tab */}
                                    {selectedTabIndex === 0 && isLoadingSuggestions && (
                                        <div className="px-4 py-2">
                                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                <span>Loading suggestions...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Navigation Hints */}
                            <div className=" border-t px-4 py-2 bg-muted/30 rounded-b-xl flex justify-between items-center">
                                <div className="flex items-center">
                                    <div>
                                        <SearchIcon className="h-4 w-4 text-[#32cd32] fill-inherit"/>
                                    </div>
                                    <span className="">QuickPeek</span>

                                </div>
                                <div className="flex items-center justify-end space-x-4 text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                        <ArrowUp className="w-3 h-3" />
                                        <ArrowDown className="w-3 h-3" />
                                        <span>Navigate</span>
                                    </div>
                                    {!isFocusedOnSearch && (
                                        <div className="flex items-center space-x-1">
                                            <span>←→</span>
                                            <span>Switch tabs</span>
                                        </div>
                                    )}
                                    <div className="flex items-center space-x-1">
                                        <CornerDownLeft className="w-3 h-3" />
                                        <span>Select/Search</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Tab</kbd>
                                        <span>Focus tabs</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Esc</kbd>
                                        <span>Close</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

