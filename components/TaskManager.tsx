import React, { useState, useEffect } from "react";
import {
  taskManagerHiddenStorage,
  categoryTasksStorage,
} from "@/components/storage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { Task } from "@/components/types";
import AddTaskPopover from "./AddTaskPopover";
import { format } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { List } from "lucide-react";

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskManagerHidden, setIsTaskManagerHidden] =
    useState<boolean>(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>("Todos");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); // State for categories
  // console.log(tasks);
  useEffect(() => {
    const loadTaskManagerVisibility = async () => {
      const hidden = await taskManagerHiddenStorage.getValue();
      setIsTaskManagerHidden(hidden);
    };

    loadTaskManagerVisibility();

    const watchTaskManagerHidden = taskManagerHiddenStorage.watch((hidden) => {
      setIsTaskManagerHidden(hidden);
    });

    return () => {
      watchTaskManagerHidden();
    };
  }, []);

  useEffect(() => {
    const loadTasks = async () => {
      const storedCategoryTasks = await categoryTasksStorage.getValue();
      setTasks(storedCategoryTasks?.[currentCategory] || []);
    };

    loadTasks();

    const unwatchTasks = categoryTasksStorage.watch((newCategoryTasks) => {
      setTasks(newCategoryTasks?.[currentCategory] || []);
    });

    return () => {
      unwatchTasks();
    };
  }, [currentCategory]);

  useEffect(() => {
    const loadCategories = async () => {
      const storedCategoryTasks = await categoryTasksStorage.getValue();
      setAvailableCategories(Object.keys(storedCategoryTasks || { Todos: [] }));
    };
    loadCategories();
  }, []); // Load categories on component mount

  const handleTaskAdded = async () => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    setTasks(storedCategoryTasks?.[currentCategory] || []);
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory = storedCategoryTasks?.[currentCategory] || [];
    const updatedTasksInCategory = currentTasksInCategory.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: updatedTasksInCategory,
    });
  };

  const deleteTask = async (taskId: string) => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory = storedCategoryTasks?.[currentCategory] || [];
    const updatedTasksInCategory = currentTasksInCategory.filter(
      (task) => task.id !== taskId
    );

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: updatedTasksInCategory,
    });
  };

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category);
  };

  const handleAddNewCategory = async () => {
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName) {
      const storedCategoryTasks = await categoryTasksStorage.getValue();
      await categoryTasksStorage.setValue({
        ...storedCategoryTasks,
        [newCategoryName]: [],
      });
      setAvailableCategories(
        Object.keys({ ...storedCategoryTasks, [newCategoryName]: [] })
      ); // Update categories state
      setCurrentCategory(newCategoryName);
    }
  };

  if (isTaskManagerHidden) {
    return null;
  }

  const incompleteTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  return (
    <div
      className="w-80 max-w-md rounded-md p-4 backdrop-blur-sm  border border-white/5 shadow-md"
      style={{ position: "relative" }}
    >
      <div className="flex justify-between items-center mb-2 pb-4 border-b border-white/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="capitalize font-semibold text-lg text-white hover:bg-white/5"
            >
              {currentCategory} <List className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {availableCategories.map((category) => (
              <DropdownMenuItem
                key={category}
                onSelect={() => handleCategoryChange(category)}
              >
                {category}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onSelect={handleAddNewCategory} // Call async function directly
            >
              + Add New List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <AddTaskPopover
          onTaskAdded={handleTaskAdded}
          currentCategory={currentCategory}
        />
      </div>

      <ul>
        {incompleteTasks.map((task) => (
          <li
            key={task.id}
            className="py-2 border-b border-white/20 last:border-b-0 animate-in fade-in-0 slide-in-from-top-4 duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  className="rounded-full w-4 h-4"
                  id={`task-complete-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                />
                <div className="grid gap-0.5">
                  <label
                    htmlFor={`task-complete-${task.id}`}
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white ${
                      task.completed ? "line-through opacity-50" : ""
                    }`}
                  >
                    {task.title}
                  </label>
                  {task.description && (
                    <p className="text-xs text-white/70 truncate">
                      {task.description}
                    </p>
                  )}
                  {task.dueDate && (
                    <p
                      className={`text-xs ${
                        task.dueDate && new Date(task.dueDate) < new Date()
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      {task.dueDate
                        ? `${format(new Date(task.dueDate), "MMM dd, yyyy")}`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                className="hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-full text-white"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Delete Task</span>
              </Button>
            </div>
          </li>
        ))}
        {incompleteTasks.length === 0 && (
          <li className="py-2 text-sm text-white/70 text-center">
            No tasks yet in this category. Add a new one!
          </li>
        )}
      </ul>

      {completedTasks.length > 0 && (
        <Collapsible
          className="mt-4 border-t border-white/20"
          open={showCompletedTasks}
          onOpenChange={setShowCompletedTasks}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
            <span className="font-medium text-sm text-white/80">
              Completed Tasks ({completedTasks.length})
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:opacity-80 text-white",
                showCompletedTasks && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <ul>
              {completedTasks.map((task) => (
                <li
                  key={task.id}
                  className="py-2 border-b border-white/20 last:border-b-0 animate-in fade-in-0 slide-in-from-top-4 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        className="rounded-full w-4 h-4"
                        id={`task-complete-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskCompletion(task.id)}
                      />
                      <div className="grid gap-0.5">
                        <label
                          htmlFor={`task-complete-${task.id}`}
                          className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 line-through opacity-50 text-white`}
                        >
                          {task.title}
                        </label>
                        {task.description && (
                          <p className="text-xs text-white/70 truncate">
                            {task.description}
                          </p>
                        )}
                        {task.dueDate && (
                          // If due date is missed, it will be shown in red.
                          <p
                            className={`text-xs ${
                              task.dueDate &&
                              new Date(task.dueDate) < new Date()
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {task.dueDate
                              ? `${format(
                                  new Date(task.dueDate),
                                  "MMM dd, yyyy"
                                )}`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTask(task.id)}
                      className="hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-full text-white "
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Delete Task</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default TaskManager;
