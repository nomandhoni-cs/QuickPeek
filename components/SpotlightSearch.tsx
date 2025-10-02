import React, { useState, useEffect, useCallback, useRef } from "react"
import { Command } from "cmdk"
import { Search } from "lucide-react"
import { ScrollArea } from "./ui/scroll-area"
import TrialRemaining from "./TrialRemaining"
import RowSkeleton from "./RowSkeleton"
import { handleSearch, isValidUrl } from "@/lib/searchUtils"
import { FireIcon } from "@heroicons/react/24/solid"
import { usePremiumFeatures } from "@/hooks/PremiumFeaturesContext"
import GetPremiumFeature from "./GetPremiumFeature"

interface SpotlightSearchProps {
  onClose: () => void
}

interface SearchItem {
  id: string | number
  url: string
  title: string
  favIconUrl?: string
  filename?: string
  startTime?: number
  state?: string
  lastVisitTime?: number
}

interface SearchResult {
  recent: SearchItem[]
  tabs: SearchItem[]
  history: SearchItem[]
  bookmarks: SearchItem[]
  downloads: SearchItem[]
}

interface SectionCache {
  [key: string]: {
    lastTerm: string
    data: SearchItem[]
  }
}

const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ onClose }) => {
  const { canAccessPremiumFeatures, isPaidUser } = usePremiumFeatures()

  const [input, setInput] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<keyof SearchResult>("recent")
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null)
  const [hasArrowKeyPressed, setHasArrowKeyPressed] = useState(false)

  const resultsRef = useRef<HTMLDivElement>(null)
  const selectedItemRef = useRef<HTMLDivElement>(null)
  const [sectionCache, setSectionCache] = useState<SectionCache>({})


  const handleTabAction = async (tabId: number, action: "activate" | "close") => {
    try {
      await browser.runtime.sendMessage({
        action: "tabAction",
        tabId,
        tabAction: action,
      })
      fetchResults(input)
      if (action === "activate") onClose()
    } catch (error) {
      console.error("Failed to perform tab action:", error)
    }
  }

  const handleSubmit = useCallback(
    async (value: string) => {
      const trimmedValue = value.trim()
      if (isValidUrl(trimmedValue)) {
        const url = trimmedValue.includes("://") ? trimmedValue : `https://${trimmedValue}`
        window.open(url, "_blank")
      } else {
        handleSearch(trimmedValue)
      }
      onClose()
    },
    [onClose, isValidUrl]
  )

  const fetchResults = useCallback(
    async (searchTerm: string) => {
      if (searchTerm.length < 3) {
        setResults((prev) =>
          prev
            ? { ...prev, [activeSection]: [] }
            : { recent: [], tabs: [], history: [], bookmarks: [], downloads: [] }
        )
        return
      }

      // Cache hit
      if (sectionCache[activeSection]?.lastTerm === searchTerm) {
        setResults((prev) =>
          prev
            ? { ...prev, [activeSection]: sectionCache[activeSection].data }
            : {
              recent: [],
              tabs: [],
              history: [],
              bookmarks: [],
              downloads: [],
              [activeSection]: sectionCache[activeSection].data,
            }
        )
        return
      }

      setLoading(true)
      try {
        const response = await browser.runtime.sendMessage({
          action: "fetchSection",
          section: activeSection,
          searchTerm,
        })

        if (response) {
          setSectionCache((prev) => ({
            ...prev,
            [activeSection]: { lastTerm: searchTerm, data: response[activeSection] },
          }))
          setResults((prev) => ({ ...prev, ...response }))
          setSelectedItemIndex(null)
          setHasArrowKeyPressed(false)
        }
      } catch (error) {
        console.error("Failed to fetch results:", error)
      } finally {
        setLoading(false)
      }
    },
    [activeSection, sectionCache]
  )

  useEffect(() => {
    fetchResults(input)
  }, [input, activeSection, fetchResults])

  // Keyboard navigation (Up/Down inside items, Left/Right switches section)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results) return

      const sections: (keyof SearchResult)[] = ["recent", "tabs", "history", "bookmarks", "downloads"]
      const currentSectionResults = results[activeSection]

      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp": {
          e.preventDefault()
          setHasArrowKeyPressed(true)
          if (currentSectionResults.length === 0) return

          if (selectedItemIndex === null) {
            setSelectedItemIndex(e.key === "ArrowDown" ? 0 : currentSectionResults.length - 1)
            return
          }
          setSelectedItemIndex((prev) => {
            if (prev === null) return 0
            if (e.key === "ArrowDown") {
              return prev < currentSectionResults.length - 1 ? prev + 1 : 0
            } else {
              return prev > 0 ? prev - 1 : currentSectionResults.length - 1
            }
          })
          break
        }
        case "ArrowRight": {
          e.preventDefault()
          const currentIndex = sections.indexOf(activeSection)
          const nextSection = sections[(currentIndex + 1) % sections.length]
          setActiveSection(nextSection)
          setSelectedItemIndex(null)
          setHasArrowKeyPressed(false)
          break
        }
        case "ArrowLeft": {
          e.preventDefault()
          const prevIndex = sections.indexOf(activeSection)
          const prevSection = sections[(prevIndex - 1 + sections.length) % sections.length]
          setActiveSection(prevSection)
          setSelectedItemIndex(null)
          setHasArrowKeyPressed(false)
          break
        }
        case "Enter": {
          if (hasArrowKeyPressed && currentSectionResults.length > 0 && selectedItemIndex !== null) {
            const selectedItem = currentSectionResults[selectedItemIndex]
            handleItemSelect(selectedItem)
          } else if (!hasArrowKeyPressed && selectedItemIndex === null) {
            handleSubmit(input)
          } else if (input.trim()) {
            handleSubmit(input)
          }
          break
        }
        case "Escape":
          onClose()
          break
      }
    },
    [results, activeSection, selectedItemIndex, onClose, input, handleSubmit, hasArrowKeyPressed]
  )

  const handleDownloadAction = async (downloadId: number, action: "show" | "open") => {
    try {
      const response = await browser.runtime.sendMessage({
        action: "downloadAction",
        downloadId,
        downloadAction: action,
      })
      if (!response?.success) throw new Error(response?.error || "Failed to perform download action")
      onClose()
    } catch (error) {
      console.error("Failed to perform download action:", error)
    }
  }

  const handleItemSelect = (item: SearchItem) => {
    if ("filename" in item) {
      handleDownloadAction(Number(item.id), "show")
      return
    }
    if ("favIconUrl" in item) {
      handleTabAction(Number(item.id), "activate")
      return
    }
    window.open(item.url, "_blank")
    onClose()
  }

  const renderSectionTabs = () => {
    const sections: (keyof SearchResult)[] = ["recent", "tabs", "history", "bookmarks", "downloads"]
    return (
      <div className="flex border-b border-border/50 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
        {sections.map((section) => (
          <button
            key={section}
            className={`flex-1 px-3 py-2.5 capitalize flex items-center justify-center gap-1.5 text-sm font-medium transition-all duration-150 ${activeSection === section
              ? "text-foreground border-b-2 border-primary bg-accent/50"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              }`}
            onClick={() => {
              setActiveSection(section)
              setSelectedItemIndex(null)
              setHasArrowKeyPressed(false)
            }}
          >
            {section}
            {section !== "recent" && <FireIcon className="h-3.5 w-3.5 text-amber-400" />}
          </button>
        ))}
      </div>
    )
  }

  const filteredResults = () => {
    if (!results) return []
    return results[activeSection] || []
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length > maxLength) return text.slice(0, maxLength) + "..."
    return text
  }

  const renderResultItems = () => {
    const items = filteredResults()

    return items.map((item, index) => {
      let icon: React.ReactNode = null
      let primaryText = ""
      let secondaryText = ""

      switch (activeSection) {
        case "recent":
          if ("favIconUrl" in item) {
            icon = item.favIconUrl ? (
              <img src={item.favIconUrl} alt="" className="w-4 h-4 rounded flex-shrink-0" />
            ) : null
          }
          primaryText = item.title
          secondaryText = item.url
          secondaryText += ` • ${new Date(item.lastVisitTime || Date.now()).toLocaleString()}`
          break
        case "tabs":
          icon = (item as any).favIconUrl ? (
            <img src={(item as any).favIconUrl} alt="" className="w-4 h-4 rounded flex-shrink-0" />
          ) : null
          primaryText = item.title
          secondaryText = item.url
          break
        case "history":
          primaryText = item.title
          secondaryText = item.url
          break
        case "bookmarks":
          primaryText = item.title
          secondaryText = item.url
          break
        case "downloads":
          primaryText = (item as any).filename || ""
          secondaryText = `${new Date((item as any).startTime).toLocaleString()} - ${(item as any).state}`
          break
      }

      const isSelected = index === selectedItemIndex && hasArrowKeyPressed

      return (
        <Command.Item
          key={item.id}
          ref={isSelected ? selectedItemRef : null}
          value={`${primaryText} ${secondaryText}`}
          onSelect={() => {
            setHasArrowKeyPressed(true)
            setSelectedItemIndex(index)
            handleItemSelect(item)
          }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${isSelected
            ? "bg-accent text-accent-foreground shadow-sm ring-1 ring-primary/50"
            : "hover:bg-accent/50"
            }`}
        >
          {icon}
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium text-sm">
              {truncateText(primaryText, 90)}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {truncateText(secondaryText, 90)}
            </div>
          </div>
        </Command.Item>
      )
    })
  }

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [selectedItemIndex])

  return (
    <div
      id="quickpeek-search-container"
      className="flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl absolute top-[20%] px-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        {!isPaidUser && <TrialRemaining />}

        <Command
          shouldFilter={false}
          className="rounded-2xl border border-border/50 overflow-hidden flex flex-col bg-card shadow-2xl"
          onKeyDown={handleKeyDown}
        >
          {/* Search Input Section with Icon */}
          <div className="relative border-b border-border/50 bg-card">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Command.Input
              placeholder="Search tabs, history, bookmarks, downloads, or enter a URL..."
              className="w-full h-14 pl-12 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground border-none outline-none focus:outline-none focus:ring-0"
              value={input}
              onValueChange={setInput}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose()
              }}
              autoFocus
            />
          </div>

          {/* Results */}
          {input.length >= 3 && (
            <>
              {results && renderSectionTabs()}
              <ScrollArea className="h-[320px]" scrollHideDelay={0}>
                <Command.List>
                  {loading ? (
                    <div className="p-3">
                      <RowSkeleton count={4} />
                    </div>
                  ) : results ? (
                    <div ref={resultsRef} className="p-2 space-y-1">
                      {activeSection === "recent" || canAccessPremiumFeatures ? (
                        filteredResults().length > 0 ? (
                          renderResultItems()
                        ) : (
                          <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                            No results found
                          </Command.Empty>
                        )
                      ) : (
                        <GetPremiumFeature />
                      )}
                    </div>
                  ) : (
                    <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                      No results found
                    </Command.Empty>
                  )}
                </Command.List>
              </ScrollArea>
            </>
          )}

          {/* Hint text when no input */}
          {input.length < 3 && input.length > 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least 3 characters to search
            </div>
          )}
        </Command>
      </div>
    </div>
  )
}

export default SpotlightSearch