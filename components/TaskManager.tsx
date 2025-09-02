// components/TaskManager.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  taskManagerHiddenStorage,
  categoryTasksStorage,
} from "@/components/storage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  X,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Task } from "@/components/types";
import AddTaskPopover from "./AddTaskPopover";
import { format, isToday, isTomorrow, isPast, isThisWeek } from "date-fns";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface TaskManagerProps {
  className?: string;
}

const TaskManager: React.FC<TaskManagerProps> = ({ className }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState<string>("Todos");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

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
      setAvailableCategories(
        Object.keys(storedCategoryTasks || { Todos: [] })
      );
    };
    loadCategories();
  }, []);

  const handleTaskAdded = async () => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    setTasks(storedCategoryTasks?.[currentCategory] || []);
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory =
      storedCategoryTasks?.[currentCategory] || [];
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
    const currentTasksInCategory =
      storedCategoryTasks?.[currentCategory] || [];
    const updatedTasksInCategory = currentTasksInCategory.filter(
      (task) => task.id !== taskId
    );

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: updatedTasksInCategory,
    });
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
      );
      setCurrentCategory(newCategoryName);
    }
  };

  const deleteCategory = async (category: string) => {
    if (category === "Todos") {
      alert("Cannot delete the default category");
      return;
    }

    const confirmDelete = confirm(`Delete category "${category}"?`);
    if (confirmDelete) {
      const storedCategoryTasks = await categoryTasksStorage.getValue();
      const { [category]: _, ...rest } = storedCategoryTasks || {};
      await categoryTasksStorage.setValue(rest);
      setAvailableCategories(Object.keys(rest));
      if (currentCategory === category) {
        setCurrentCategory("Todos");
      }
    }
  };

  // Filter tasks based on search and priority
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority
      ? task.priority === filterPriority
      : true;
    return matchesSearch && matchesPriority;
  });

  const incompleteTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  // Group tasks by date
  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    tasks.forEach((task) => {
      if (!task.dueDate) {
        groups.later.push(task);
      } else {
        const dueDate = new Date(task.dueDate);
        if (isPast(dueDate) && !isToday(dueDate)) {
          groups.overdue.push(task);
        } else if (isToday(dueDate)) {
          groups.today.push(task);
        } else if (isTomorrow(dueDate)) {
          groups.tomorrow.push(task);
        } else if (isThisWeek(dueDate)) {
          groups.thisWeek.push(task);
        } else {
          groups.later.push(task);
        }
      }
    });

    return groups;
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "group relative p-3 rounded-lg border transition-all duration-200",
          "hover:shadow-md hover:border-primary/20",
          task.completed
            ? "bg-muted/30 border-muted/50"
            : "bg-card/50 backdrop-blur-sm border-border/50",
          isOverdue && !task.completed && "border-destructive/50 bg-destructive/5"
        )}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleTaskCompletion(task.id)}
            className="mt-0.5 transition-colors"
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" />
            ) : (
              <Circle className={cn(
                "h-5 w-5",
                isOverdue ? "text-destructive" : "text-muted-foreground hover:text-primary"
              )} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-medium text-sm",
                task.completed && "line-through opacity-60"
              )}
            >
              {task.title}
            </p>

            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.dueDate && (
                <Badge
                  variant={isOverdue ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(task.dueDate), "MMM dd")}
                </Badge>
              )}

              {task.priority && (
                <Badge
                  variant={
                    task.priority === "high"
                      ? "destructive"
                      : task.priority === "medium"
                        ? "default"
                        : "secondary"
                  }
                  className="text-xs"
                >
                  {task.priority}
                </Badge>
              )}

              {task.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => deleteTask(task.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  };

  const groupedTasks = groupTasksByDate(incompleteTasks);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="font-semibold text-lg p-0 h-auto">
                {currentCategory}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48">
              {availableCategories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onSelect={() => setCurrentCategory(category)}
                  className="justify-between"
                >
                  {category}
                  {category !== "Todos" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(category);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleAddNewCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add New List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode(viewMode === "list" ? "board" : "list")}
            >
              {viewMode === "list" ? "📋" : "📝"}
            </Button>
            <AddTaskPopover
              onTaskAdded={handleTaskAdded}
              currentCategory={currentCategory}
            />
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setFilterPriority(null)}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterPriority("high")}>
                High Priority
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterPriority("medium")}>
                Medium Priority
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setFilterPriority("low")}>
                Low Priority
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Overdue Tasks */}
          {groupedTasks.overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Overdue</span>
                <Badge variant="destructive" className="ml-auto">
                  {groupedTasks.overdue.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {groupedTasks.overdue.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Today's Tasks */}
          {groupedTasks.today.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Today</span>
                <Badge variant="secondary" className="ml-auto">
                  {groupedTasks.today.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {groupedTasks.today.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Tomorrow's Tasks */}
          {groupedTasks.tomorrow.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tomorrow</span>
                <Badge variant="secondary" className="ml-auto">
                  {groupedTasks.tomorrow.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {groupedTasks.tomorrow.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* This Week's Tasks */}
          {groupedTasks.thisWeek.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">This Week</span>
                <Badge variant="secondary" className="ml-auto">
                  {groupedTasks.thisWeek.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {groupedTasks.thisWeek.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {/* Later Tasks */}
          {groupedTasks.later.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Later</span>
                <Badge variant="secondary" className="ml-auto">
                  {groupedTasks.later.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {groupedTasks.later.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          {incompleteTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No tasks yet. Add your first task!
              </p>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <Collapsible
              open={showCompletedTasks}
              onOpenChange={setShowCompletedTasks}
              className="pt-4 border-t"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
                <span className="text-sm font-medium text-muted-foreground">
                  Completed ({completedTasks.length})
                </span>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showCompletedTasks && "rotate-90"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-2">
                <AnimatePresence>
                  {completedTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TaskManager;