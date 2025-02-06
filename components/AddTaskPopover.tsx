import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { categoryTasksStorage } from "@/components/storage"; // Import categoryTasksStorage
import { v4 as uuidv4 } from "uuid";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddTaskPopoverProps {
  onTaskAdded: () => void;
  currentCategory: string; // Receive currentCategory as prop
}

const AddTaskPopover: React.FC<AddTaskPopoverProps> = ({
  onTaskAdded,
  currentCategory,
}) => {
  // Destructure currentCategory
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const handleAddTask = async () => {
    if (!title) return;

    let formattedDueDate = "";
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so add 1
      const day = String(date.getDate()).padStart(2, "0");
      formattedDueDate = `${year}-${month}-${day}`;
    }

    const newTask = {
      id: uuidv4(),
      title,
      description,
      dueDate: formattedDueDate,
      completed: false,
    };

    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory = storedCategoryTasks?.[currentCategory] || []; // Get tasks for current category

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: [...currentTasksInCategory, newTask], // Add new task to current category
    });

    setTitle("");
    setDescription("");
    setDate(undefined);
    setIsOpen(false);
    onTaskAdded();
  };

  const handleCancel = () => {
    setIsOpen(false);
    setTitle("");
    setDescription("");
    setDate(undefined);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-transparent text-primary">
          Add Task <Plus className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto px-6 py-8 mr-36 mt-6">
        <div className="grid gap-4">
          {/* Form content remains the same */}
          <div>
            <h4 className="text-lg font-medium leading-none">Add New Task</h4>
            <p className="text-sm text-muted-foreground">
              Enter the details for your new task.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="popover-title">Title</Label>
            <Input
              id="popover-title"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="popover-description">Description (Optional)</Label>
            <Textarea
              id="popover-description"
              placeholder="Task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="popover-dueDate">Due Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleAddTask}>
            Add Task
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddTaskPopover;
