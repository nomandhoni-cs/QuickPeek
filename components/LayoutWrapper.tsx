// components/LayoutWrapper.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { layoutConfigStorage, LayoutConfig } from "@/lib/layout-storage";
import TaskManager from "./TaskManager";
import { taskManagerHiddenStorage } from "@/components/storage";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";

interface LayoutWrapperProps {
    children: React.ReactNode;
}

const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
    const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
    const [isTaskManagerHidden, setIsTaskManagerHidden] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            const [config, hidden] = await Promise.all([
                layoutConfigStorage.getValue(),
                taskManagerHiddenStorage.getValue(),
            ]);
            setLayoutConfig(config);
            setIsTaskManagerHidden(hidden);
            setIsCollapsed(config.isCollapsed || false);
            // Silent loading without UI feedback
            setTimeout(() => setIsLoaded(true), 100);
        };

        loadConfig();

        const unwatchLayout = layoutConfigStorage.watch((newConfig) => {
            setLayoutConfig(newConfig);
            setIsCollapsed(newConfig.isCollapsed || false);
        });

        const unwatchHidden = taskManagerHiddenStorage.watch((hidden) => {
            setIsTaskManagerHidden(hidden);
        });

        return () => {
            unwatchLayout();
            unwatchHidden();
        };
    }, []);

    const toggleSidebar = async () => {
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        await layoutConfigStorage.setValue({
            ...layoutConfig!,
            isCollapsed: newCollapsed,
        });
    };

    if (isTaskManagerHidden || !layoutConfig || !isLoaded) {
        return <>{children}</>;
    }

    const isLeftSidebar = layoutConfig.mode === "sidebar-left";
    const isRightSidebar = layoutConfig.mode === "sidebar-right";

    const SidebarToggleButton = () => (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(
                "fixed top-1/2 -translate-y-1/2 z-50",
                "h-8 w-8 rounded-full",
                "bg-white/10 backdrop-blur-md border border-white/20",
                "hover:bg-white/20 transition-all duration-200",
                "shadow-lg hover:shadow-xl",
                isLeftSidebar && (isCollapsed ? "left-2" : "left-[324px]"),
                isRightSidebar && (isCollapsed ? "right-2" : "right-[324px]")
            )}
        >
            {isLeftSidebar ? (
                isCollapsed ? <PanelLeftOpen className="h-4 w-4 text-white" /> : <PanelLeftClose className="h-4 w-4 text-white" />
            ) : (
                isCollapsed ? <PanelRightOpen className="h-4 w-4 text-white" /> : <PanelRightClose className="h-4 w-4 text-white" />
            )}
        </Button>
    );

    if (layoutConfig.mode === "floating") {
        return (
            <>
                {children}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="fixed z-40"
                    style={{
                        left: layoutConfig.floatingPosition?.x || 20,
                        top: layoutConfig.floatingPosition?.y || 20,
                    }}
                >
                    <TaskManager isFloating={true} />
                </motion.div>
            </>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden">
            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <motion.aside
                        initial={{ x: isLeftSidebar ? -320 : 320, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isLeftSidebar ? -320 : 320, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed top-0 h-full z-40",
                            isLeftSidebar ? "left-0" : "right-0"
                        )}
                    >
                        <TaskManager />
                    </motion.aside>
                )}
            </AnimatePresence>

            <SidebarToggleButton />

            <main
                className={cn(
                    "h-full transition-all duration-300 ease-in-out",
                    !isCollapsed && isLeftSidebar && "pl-[320px]",
                    !isCollapsed && isRightSidebar && "pr-[320px]"
                )}
            >
                {children}
            </main>
        </div>
    );
};

export default LayoutWrapper;