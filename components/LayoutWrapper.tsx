// components/LayoutWrapper.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { layoutConfigStorage, LayoutConfig } from "@/lib/layout-storage";
import TaskManager from "./TaskManager";
import { taskManagerHiddenStorage } from "@/components/storage";
import { Button } from "@/components/ui/button";
import { GripVertical, X, Minimize2, Maximize2 } from "lucide-react";

interface LayoutWrapperProps {
    children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
    const [isTaskManagerHidden, setIsTaskManagerHidden] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const dragRef = useRef<HTMLDivElement>(null);
    const [floatingPos, setFloatingPos] = useState({ x: 20, y: 20 });

    useEffect(() => {
        const loadConfig = async () => {
            const [config, hidden] = await Promise.all([
                layoutConfigStorage.getValue(),
                taskManagerHiddenStorage.getValue(),
            ]);
            setLayoutConfig(config);
            setIsTaskManagerHidden(hidden);
            setSidebarWidth(config.sidebarWidth || 320);
            setFloatingPos(config.floatingPosition || { x: 20, y: 20 });
        };

        loadConfig();

        const unwatchLayout = layoutConfigStorage.watch((newConfig) => {
            setLayoutConfig(newConfig);
            setSidebarWidth(newConfig.sidebarWidth || 320);
            setFloatingPos(newConfig.floatingPosition || { x: 20, y: 20 });
        });

        const unwatchHidden = taskManagerHiddenStorage.watch((hidden) => {
            setIsTaskManagerHidden(hidden);
        });

        return () => {
            unwatchLayout();
            unwatchHidden();
        };
    }, []);

    const handleDragStart = (e: React.MouseEvent) => {
        if (layoutConfig?.mode !== "floating") return;
        setIsDragging(true);
        const startX = e.clientX - floatingPos.x;
        const startY = e.clientY - floatingPos.y;

        const handleMouseMove = (e: MouseEvent) => {
            const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - startX));
            const newY = Math.max(0, Math.min(window.innerHeight - 600, e.clientY - startY));
            setFloatingPos({ x: newX, y: newY });
        };

        const handleMouseUp = async () => {
            setIsDragging(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            // Save position
            await layoutConfigStorage.setValue({
                ...layoutConfig!,
                floatingPosition: floatingPos,
            });
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleResize = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.clientX - startX;
            const newWidth = layoutConfig?.mode === "sidebar-left"
                ? startWidth + diff
                : startWidth - diff;
            const clampedWidth = Math.max(280, Math.min(600, newWidth));
            setSidebarWidth(clampedWidth);
        };

        const handleMouseUp = async () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);

            // Save width
            await layoutConfigStorage.setValue({
                ...layoutConfig!,
                sidebarWidth: sidebarWidth,
            });
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const toggleCollapse = async () => {
        await layoutConfigStorage.setValue({
            ...layoutConfig!,
            isCollapsed: !layoutConfig?.isCollapsed,
        });
    };

    if (isTaskManagerHidden || !layoutConfig) {
        return <>{children}</>;
    }

    const TaskManagerSidebar = () => (
        <aside
            className={cn(
                "relative bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-xl transition-all duration-300",
                layoutConfig.isCollapsed && "w-0 overflow-hidden",
                !layoutConfig.isCollapsed && `w-[${sidebarWidth}px]`
            )}
            style={{ width: layoutConfig.isCollapsed ? 0 : sidebarWidth }}
        >
            <div className="h-full flex flex-col">
                {/* Collapse button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute top-2 z-10 h-6 w-6",
                        layoutConfig.mode === "sidebar-left"
                            ? "-right-3 rounded-r-md"
                            : "-left-3 rounded-l-md"
                    )}
                    onClick={toggleCollapse}
                >
                    {layoutConfig.isCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>

                {/* Resize handle */}
                <div
                    className={cn(
                        "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors",
                        layoutConfig.mode === "sidebar-left" ? "right-0" : "left-0",
                        isResizing && "bg-primary/30"
                    )}
                    onMouseDown={handleResize}
                />

                <TaskManager className="h-full" />
            </div>
        </aside>
    );

    const TaskManagerFloating = () => (
        <motion.div
            ref={dragRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "fixed z-50 w-96 h-[600px] bg-background/95 backdrop-blur-xl",
                "border border-border/50 rounded-lg shadow-2xl",
                isDragging && "cursor-grabbing"
            )}
            style={{
                left: floatingPos.x,
                top: floatingPos.y,
            }}
        >
            {/* Drag handle */}
            <div
                className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-4 border-b cursor-grab"
                onMouseDown={handleDragStart}
            >
                <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tasks</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => taskManagerHiddenStorage.setValue(true)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-full pt-10">
                <TaskManager className="h-full" />
            </div>
        </motion.div>
    );

    if (layoutConfig.mode === "floating") {
        return (
            <>
                {children}
                <AnimatePresence>
                    <TaskManagerFloating />
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className="layout h-screen w-full flex">
            {layoutConfig.mode === "sidebar-left" && <TaskManagerSidebar />}
            <main className="flex-1 overflow-auto">{children}</main>
            {layoutConfig.mode === "sidebar-right" && <TaskManagerSidebar />}
        </div>
    );
};

export default LayoutWrapper;