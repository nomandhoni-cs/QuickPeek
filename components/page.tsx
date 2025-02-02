"use client"

import { useEffect, useState, useRef, type KeyboardEvent } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { FileText, Mail, UserCircle2, CheckSquare, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CommandDemo() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState("all")
  const [isOpen, setIsOpen] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const commandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "m" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
      if (e.key === " " && document.activeElement === inputRef.current) {
        e.preventDefault()
      }
    }

    document.addEventListener("keydown", down as any)
    return () => document.removeEventListener("keydown", down as any)
  }, [])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      const tabs = ["all", "documents", "actions", "contacts"]
      const currentIndex = tabs.indexOf(activeTab)
      if (e.key === "ArrowLeft") {
        setActiveTab(tabs[(currentIndex - 1 + tabs.length) % tabs.length])
      } else {
        setActiveTab(tabs[(currentIndex + 1) % tabs.length])
      }
    }
  }

  if (!mounted) return null

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gradient dark:bg-dark-gradient">
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 w-full h-full bg-gradient-animated dark:bg-dark-gradient-animated" />
      </div>

      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full bg-background/30 backdrop-blur-sm"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      <div className="relative h-full w-full flex items-start justify-center px-4 pt-32">
        {isOpen && (
          <div 
            className="w-full max-w-[640px] animate-in fade-in-0 slide-in-from-top-4 duration-200 relative" 
            ref={commandRef}
          >
            {/* Shortcuts positioned above the command box */}
            <div className="absolute -top-6 right-0 flex gap-1 items-center">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background/30 backdrop-blur-sm px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>M
              </kbd>
              <span className="text-xs text-muted-foreground">/</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background/30 backdrop-blur-sm px-1.5 font-mono text-[10px] font-medium opacity-100">
                ESC
              </kbd>
            </div>

            <Command 
              className="rounded-lg border-0 shadow-2xl glassmorphism overflow-hidden flex flex-col" 
              onKeyDown={handleKeyDown}
            >
              <div className="flex flex-col flex-none">
                <div className="border-b border-border/20">
                  <CommandInput 
                    ref={inputRef}
                    placeholder="Search for anything, documents, actions, contacts..." 
                    className="w-full"
                  />
                </div>
                <div className="border-b border-border/20">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start h-12 bg-transparent">
                      <TabsTrigger value="all" className="data-[state=active]:bg-accent/30">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="documents" className="data-[state=active]:bg-accent/30">
                        Documents
                      </TabsTrigger>
                      <TabsTrigger value="actions" className="data-[state=active]:bg-accent/30">
                        Actions
                      </TabsTrigger>
                      <TabsTrigger value="contacts" className="data-[state=active]:bg-accent/30">
                        Contacts
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  {(activeTab === "all" || activeTab === "actions") && (
                    <CommandGroup heading="Recent Actions">
                      <CommandItem>
                        <Mail className="mr-2 h-4 w-4 text-blue-400" />
                        <span>Draft an email</span>
                        <span className="ml-auto text-xs text-muted-foreground">Action</span>
                      </CommandItem>
                      <CommandItem>
                        <CheckSquare className="mr-2 h-4 w-4 text-green-400" />
                        <span>Create a task</span>
                        <span className="ml-auto text-xs text-muted-foreground">Action</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {(activeTab === "all" || activeTab === "documents") && (
                    <CommandGroup heading="Documents">
                      <CommandItem>
                        <FileText className="mr-2 h-4 w-4 text-purple-400" />
                        <span>mydoc.pdf</span>
                        <span className="ml-auto text-xs text-muted-foreground">4564 KB</span>
                      </CommandItem>
                      <CommandItem>
                        <FileText className="mr-2 h-4 w-4 text-purple-400" />
                        <span>design_brief.pdf</span>
                        <span className="ml-auto text-xs text-muted-foreground">2890 KB</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                  {(activeTab === "all" || activeTab === "contacts") && (
                    <CommandGroup heading="Contacts">
                      <CommandItem>
                        <UserCircle2 className="mr-2 h-4 w-4 text-orange-400" />
                        <span>Alice Johnson</span>
                        <span className="ml-auto text-xs text-muted-foreground">alice@example.com</span>
                      </CommandItem>
                      <CommandItem>
                        <UserCircle2 className="mr-2 h-4 w-4 text-orange-400" />
                        <span>Bob Smith</span>
                        <span className="ml-auto text-xs text-muted-foreground">bob@example.com</span>
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </div>
            </Command>
          </div>
        )}
      </div>
    </div>
  )
}

