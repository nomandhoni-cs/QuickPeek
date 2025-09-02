// components/NewTabSetting.tsx
import { useState, useEffect } from "react";
import { storage } from "wxt/storage";
import { Button } from "@/components/ui/button";
import { Settings, Layout, Monitor, Sidebar, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { taskManagerHiddenStorage } from "@/components/storage";
import { layoutConfigStorage, LayoutMode } from "@/lib/layout-storage";
import BackgroundManager from "@/components/BackgroundManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const topSitesHiddenStorage = storage.defineItem<boolean>(
  "local:topSitesHidden",
  {
    fallback: false,
    version: 1,
  }
);

export default function NewTabSetting() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTopSitesHidden, setIsTopSitesHidden] = useState<boolean>(false);
  const [isTaskManagerHidden, setIsTaskManagerHidden] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("sidebar-left");

  useEffect(() => {
    const loadSettings = async () => {
      const [topSitesHidden, taskManagerHidden, layoutConfig] = await Promise.all([
        topSitesHiddenStorage.getValue(),
        taskManagerHiddenStorage.getValue(),
        layoutConfigStorage.getValue(),
      ]);
      setIsTopSitesHidden(topSitesHidden);
      setIsTaskManagerHidden(taskManagerHidden);
      setLayoutMode(layoutConfig.mode);
    };
    loadSettings();
  }, [isDialogOpen]);

  const handleToggleTopSitesHidden = async (checked: boolean) => {
    await topSitesHiddenStorage.setValue(checked);
    setIsTopSitesHidden(checked);
  };

  const handleToggleTaskManagerHidden = async (checked: boolean) => {
    await taskManagerHiddenStorage.setValue(checked);
    setIsTaskManagerHidden(checked);
  };

  const handleLayoutModeChange = async (mode: LayoutMode) => {
    const currentConfig = await layoutConfigStorage.getValue();
    await layoutConfigStorage.setValue({
      ...currentConfig,
      mode,
    });
    setLayoutMode(mode);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="backdrop-blur-md">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Customize</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize</DialogTitle>
          <DialogDescription>
            Personalize your new tab experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <BackgroundManager />
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Task Manager Layout
                </Label>
                <RadioGroup
                  value={layoutMode}
                  onValueChange={(value) => handleLayoutModeChange(value as LayoutMode)}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="sidebar-left" id="sidebar-left" />
                    <Label htmlFor="sidebar-left" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Sidebar className="h-4 w-4" />
                      <span>Left Sidebar</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="sidebar-right" id="sidebar-right" />
                    <Label htmlFor="sidebar-right" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Sidebar className="h-4 w-4 rotate-180" />
                      <span>Right Sidebar</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value="floating" id="floating" />
                    <Label htmlFor="floating" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Square className="h-4 w-4" />
                      <span>Floating Window</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label htmlFor="top-sites-hidden" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  <span>Most Visited Sites</span>
                </Label>
                <Switch
                  id="top-sites-hidden"
                  checked={!isTopSitesHidden}
                  onCheckedChange={(checked) => handleToggleTopSitesHidden(!checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <Label htmlFor="task-manager-hidden" className="flex items-center gap-2 cursor-pointer">
                  <Layout className="h-4 w-4" />
                  <span>Task Manager</span>
                </Label>
                <Switch
                  id="task-manager-hidden"
                  checked={!isTaskManagerHidden}
                  onCheckedChange={(checked) => handleToggleTaskManagerHidden(!checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}