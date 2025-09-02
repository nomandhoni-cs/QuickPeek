// components/AddTaskDialog.tsx - Fixed version
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Task } from "@/components/types";
import { categoryTasksStorage } from "@/components/storage";

interface AddTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentCategory: string;
    onTaskAdded?: () => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({
    open,
    onOpenChange,
    currentCategory,
    onTaskAdded,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [dueTime, setDueTime] = useState("09:00");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [tags, setTags] = useState("");

    const handleSubmit = async () => {
        if (!title.trim()) return;

        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random()}`,
            title: title.trim(),
            description: description.trim() || undefined,
            dueDate: dueDate
                ? `${format(dueDate, "yyyy-MM-dd")}T${dueTime}:00`
                : undefined,
            completed: false,
            priority,
            tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0),
        };

        const storedCategoryTasks = await categoryTasksStorage.getValue();
        const currentTasks = storedCategoryTasks?.[currentCategory] || [];

        await categoryTasksStorage.setValue({
            ...storedCategoryTasks,
            [currentCategory]: [...currentTasks, newTask],
        });

        // Reset form
        setTitle("");
        setDescription("");
        setDueDate(undefined);
        setDueTime("09:00");
        setPriority("medium");
        setTags("");

        onOpenChange(false);
        onTaskAdded?.();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-3xl border-white/20 z-[200]">
                <DialogHeader>
                    <DialogTitle className="text-white">Add New Task</DialogTitle>
                    <DialogDescription className="text-white/60">
                        Create a new task in {currentCategory}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-white/80">
                            Task Title *
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-white/80">
                            Description
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details..."
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30 resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">Due Date</Label>
                            <Popover modal={true}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            "bg-white/10 border-white/20 text-white hover:bg-white/15 hover:border-white/30",
                                            !dueDate && "text-white/40"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-black/90 backdrop-blur-3xl border-white/20 z-[300]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dueDate}
                                        onSelect={setDueDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time" className="text-white/80">
                                Time
                            </Label>
                            <Input
                                id="time"
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-white/30"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-white/80">Priority</Label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-black/90 backdrop-blur-3xl border-white/20 z-[300]">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags" className="text-white/80">
                                Tags
                            </Label>
                            <Input
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="work, personal"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                    >
                        Add Task
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AddTaskDialog;