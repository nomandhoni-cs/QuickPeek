// storage/layout-storage.ts
import { storage } from "wxt/storage";

export type LayoutMode = "sidebar-left" | "sidebar-right" | "floating";

export interface LayoutConfig {
    mode: LayoutMode;
    floatingPosition?: { x: number; y: number };
    sidebarWidth?: number;
    isCollapsed?: boolean;
}

export const layoutConfigStorage = storage.defineItem<LayoutConfig>(
    "local:layoutConfig",
    {
        fallback: {
            mode: "sidebar-left",
            sidebarWidth: 320,
            isCollapsed: false,
            floatingPosition: { x: 20, y: 20 },
        },
        version: 1,
    }
);