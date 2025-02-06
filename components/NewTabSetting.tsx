// NewTabSetting Component (NewTabSetting.tsx)

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

  useEffect(() => {
    const loadTopSitesHidden = async () => {
      const hidden = await topSitesHiddenStorage.getValue();
      setIsTopSitesHidden(hidden);
    };

    loadTopSitesHidden();
  }, [isDialogOpen]);

  const handleToggleTopSitesHidden = async (checked: boolean) => {
    await topSitesHiddenStorage.setValue(checked);
    setIsTopSitesHidden(checked); // Keep updating local state for dialog switch
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Customize</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Customize</DialogTitle>
          <DialogDescription>Manage your shortcut settings.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="top-sites-hidden"
              checked={isTopSitesHidden}
              onCheckedChange={handleToggleTopSitesHidden}
            />
            <Label htmlFor="top-sites-hidden">Hide Most Visited Sites</Label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
