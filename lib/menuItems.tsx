import { Download } from "lucide-react"
import { SiGooglekeep, SiGooglecalendar, SiGooglemeet, SiGmail } from '@icons-pack/react-simple-icons'
import type { ReactNode } from "react"

export interface MenuItem {
    id: string
    label: string
    icon: ReactNode
    action: () => void
    category: string
    keywords?: string[]
}

export const MENU_ITEMS: MenuItem[] = [
    // Utilities
    {
        id: "downloads",
        label: "Open Downloads",
        icon: <Download className="w-4 h-4" />,
        action: () => window.open('chrome://downloads', '_blank'),
        category: "Utilities",
    },

    // Google Suite
    {
        id: "google-keep-new",
        label: "Create New Google Keep Note",
        icon: <SiGooglekeep color="#FFBB00" className="w-4 h-4" />,
        action: () => window.open('https://note.new', '_blank'),
        category: "Google Suite",
        keywords: ["note", "keep", "memo"],
    },
    {
        id: "google-calendar-new",
        label: "Create New Google Calendar Event",
        icon: <SiGooglecalendar color="#4285F4" className="w-4 h-4" />,
        action: () => window.open('https://cal.new', '_blank'),
        category: "Google Suite",
        keywords: ["calendar", "event", "meeting"],
    },
    {
        id: "google-meet-new",
        label: "Start a New Google Meet",
        icon: <SiGooglemeet color="#00897B" className="w-4 h-4" />,
        action: () => window.open('https://meet.new', '_blank'),
        category: "Google Suite",
        keywords: ["meet", "video", "call"],
    },
    {
        id: "gmail-compose",
        label: "Compose New Gmail",
        icon: <SiGmail color="#EA4335" className="w-4 h-4" />,
        action: () => window.open('https://mail.google.com/mail/?view=cm&fs=1', '_blank'),
        category: "Google Suite",
        keywords: ["email", "mail", "compose"],
    },
]

export const CATEGORIES = Array.from(new Set(MENU_ITEMS.map(item => item.category)))