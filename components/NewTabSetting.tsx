import { useState, useEffect } from "react";
import { storage } from "wxt/storage";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
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
import { taskManagerHiddenStorage } from "@/components/storage";
import BackgroundManager from "@/components/BackgroundManager";

const topSitesHiddenStorage = storage.defineItem<boolean>("local:topSitesHidden", {
  fallback: false,
  version: 1,
});

export default function NewTabSetting() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTopSitesHidden, setIsTopSitesHidden] = useState<boolean>(false);
  const [isTaskManagerHidden, setIsTaskManagerHidden] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      const [topSitesHidden, taskManagerHidden] = await Promise.all([
        topSitesHiddenStorage.getValue(),
        taskManagerHiddenStorage.getValue(),
      ]);
      setIsTopSitesHidden(topSitesHidden);
      setIsTaskManagerHidden(taskManagerHidden);
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Customize</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Customize</DialogTitle>
          <DialogDescription>Manage your new tab settings.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Background manager goes here */}
          <BackgroundManager />

          <div className="h-px bg-border" />

          <div className="flex items-center space-x-2">
            <Switch
              id="top-sites-hidden"
              checked={isTopSitesHidden}
              onCheckedChange={handleToggleTopSitesHidden}
            />
            <Label htmlFor="top-sites-hidden">Hide Most Visited Sites</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="task-manager-hidden"
              checked={isTaskManagerHidden}
              onCheckedChange={handleToggleTaskManagerHidden}
            />
            <Label htmlFor="task-manager-hidden">Hide Task Manager</Label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}