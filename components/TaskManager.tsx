// components/TaskManager.tsx - Fixed version
import React, { useState, useEffect, useMemo } from "react";
import {
  categoryTasksStorage,
} from "@/components/storage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  Calendar as CalendarIcon,
  Tag,
  Search,
  MoreVertical,
  Edit2,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Repeat,
  Flag,
  Copy,
  ListTodo,
  BarChart3,
  Sparkles,
  Archive,
  CalendarDays,
  CalendarRange,
  Eye,
  EyeOff,
} from "lucide-react";
import { Task } from "@/components/types";
import AddTaskDialog from "./AddTaskDialog";
import { format, addDays, eachDayOfInterval, isToday, isTomorrow, isPast, isThisWeek, isFuture, startOfToday } from "date-fns";
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";

interface TaskManagerProps {
  className?: string;
  isFloating?: boolean;
}

type ViewFilter = "today" | "week" | "all";

const TaskManager: React.FC<TaskManagerProps> = ({ className, isFloating = false }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentCategory, setCurrentCategory] = useState<string>("Todos");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("today");
  const [showFutureTasks, setShowFutureTasks] = useState(false);

  // Bulk creation state
  const [bulkTaskTitle, setBulkTaskTitle] = useState("");
  const [bulkTaskDescription, setBulkTaskDescription] = useState("");
  const [bulkStartDate, setBulkStartDate] = useState<Date>(new Date());
  const [bulkEndDate, setBulkEndDate] = useState<Date>(addDays(new Date(), 7));
  const [bulkTaskPriority, setBulkTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [bulkTaskTime, setBulkTaskTime] = useState("09:00");

  // Load tasks and watch for changes
  useEffect(() => {
    const loadTasks = async () => {
      const storedCategoryTasks = await categoryTasksStorage.getValue();
      setTasks(storedCategoryTasks?.[currentCategory] || []);
    };

    loadTasks();

    // Watch for real-time updates
    const unwatchTasks = categoryTasksStorage.watch((newCategoryTasks) => {
      if (newCategoryTasks) {
        setTasks(newCategoryTasks[currentCategory] || []);
      }
    });

    return () => {
      unwatchTasks();
    };
  }, [currentCategory]);

  // Load categories and watch for changes
  useEffect(() => {
    const loadCategories = async () => {
      const storedCategoryTasks = await categoryTasksStorage.getValue();
      setAvailableCategories(
        Object.keys(storedCategoryTasks || { Todos: [] })
      );
    };

    loadCategories();

    // Watch for category changes
    const unwatchCategories = categoryTasksStorage.watch((newCategoryTasks) => {
      if (newCategoryTasks) {
        setAvailableCategories(Object.keys(newCategoryTasks));
      }
    });

    return () => {
      unwatchCategories();
    };
  }, []);

  const handleTaskAdded = async () => {
    // Force refresh tasks
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

  const updateTask = async (updatedTask: Task) => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory = storedCategoryTasks?.[currentCategory] || [];
    const updatedTasksInCategory = currentTasksInCategory.map((task) =>
      task.id === updatedTask.id ? updatedTask : task
    );

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: updatedTasksInCategory,
    });
    setEditingTask(null);
  };

  const handleAddNewCategory = async () => {
    const newCategoryName = prompt("Enter new category name:");
    if (newCategoryName && newCategoryName.trim()) {
      const storedCategoryTasks = await categoryTasksStorage.getValue();
      await categoryTasksStorage.setValue({
        ...storedCategoryTasks,
        [newCategoryName]: [],
      });
      setCurrentCategory(newCategoryName);
    }
  };

  const createBulkTasks = async () => {
    if (!bulkTaskTitle.trim()) return;

    const dates = eachDayOfInterval({
      start: bulkStartDate,
      end: bulkEndDate,
    });

    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory = storedCategoryTasks?.[currentCategory] || [];

    const newTasks: Task[] = dates.map((date) => ({
      id: `task-${Date.now()}-${Math.random()}`,
      title: bulkTaskTitle,
      description: bulkTaskDescription || undefined,
      dueDate: format(date, 'yyyy-MM-dd') + 'T' + bulkTaskTime + ':00',
      completed: false,
      priority: bulkTaskPriority,
      tags: ['recurring'],
    }));

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: [...currentTasksInCategory, ...newTasks],
    });

    // Reset form
    setBulkTaskTitle("");
    setBulkTaskDescription("");
    setShowBulkCreate(false);
  };

  const duplicateTask = async (task: Task) => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory = storedCategoryTasks?.[currentCategory] || [];

    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random()}`,
      completed: false,
    };

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: [...currentTasksInCategory, newTask],
    });
  };

  const archiveCompletedTasks = async () => {
    const storedCategoryTasks = await categoryTasksStorage.getValue();
    const currentTasksInCategory = storedCategoryTasks?.[currentCategory] || [];
    const incompleteTasks = currentTasksInCategory.filter(task => !task.completed);

    await categoryTasksStorage.setValue({
      ...storedCategoryTasks,
      [currentCategory]: incompleteTasks,
    });
  };

  // Get all unique tags from tasks
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => {
      task.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [tasks]);

  // Filter tasks based on view filter and other filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority ? task.priority === filterPriority : true;
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => task.tags?.includes(tag));
      return matchesSearch && matchesPriority && matchesTags;
    });

    // Apply view filter
    if (viewFilter === "today" && !showFutureTasks) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return true; // Always show tasks without dates
        const dueDate = new Date(task.dueDate);
        return isToday(dueDate) || isPast(dueDate);
      });
    } else if (viewFilter === "week") {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return true;
        const dueDate = new Date(task.dueDate);
        return isThisWeek(dueDate) || isPast(dueDate);
      });
    }
    // viewFilter === "all" shows everything

    return filtered;
  }, [tasks, searchQuery, filterPriority, selectedTags, viewFilter, showFutureTasks]);

  const incompleteTasks = filteredTasks.filter((task) => !task.completed);
  const completedTasks = filteredTasks.filter((task) => task.completed);

  // Calculate stats
  const stats = useMemo(() => {
    const todayTasks = tasks.filter(task =>
      task.dueDate && isToday(new Date(task.dueDate))
    );
    const overdueTasks = tasks.filter(task =>
      task.dueDate && isPast(new Date(task.dueDate)) && !task.completed && !isToday(new Date(task.dueDate))
    );
    const completionRate = tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

    return {
      total: tasks.length,
      completed: completedTasks.length,
      pending: incompleteTasks.length,
      today: todayTasks.length,
      overdue: overdueTasks.length,
      completionRate,
    };
  }, [tasks, completedTasks, incompleteTasks]);

  // Group tasks by date
  const groupTasksByDate = (tasks: Task[]) => {
    const groups: { [key: string]: Task[] } = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: [],
      noDate: [],
    };

    tasks.forEach((task) => {
      if (!task.dueDate) {
        groups.noDate.push(task);
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "group relative p-3 rounded-xl transition-all duration-200",
          "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]",
          "hover:bg-white/[0.07] hover:border-white/[0.15] hover:shadow-lg",
          task.completed && "opacity-50",
          isOverdue && !task.completed && "border-red-400/20 bg-red-400/[0.03]"
        )}
      >
        <div className="flex items-start gap-3">
          <button
            onClick={() => toggleTaskCompletion(task.id)}
            className="mt-0.5 transition-all hover:scale-110"
          >
            {task.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-400 drop-shadow-glow" />
            ) : (
              <Circle className={cn(
                "h-5 w-5 transition-colors",
                isOverdue ? "text-red-400" : "text-white/50 hover:text-white/80"
              )} />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium text-sm text-white/90",
              task.completed && "line-through opacity-60"
            )}>
              {task.title}
            </p>

            {task.description && (
              <p className="text-xs text-white/50 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {task.dueDate && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs backdrop-blur-md bg-white/[0.03] border-white/[0.15]",
                    isOverdue ? "text-red-400 border-red-400/30" : "text-white/60"
                  )}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(task.dueDate), "MMM dd, HH:mm")}
                </Badge>
              )}

              {task.priority && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs backdrop-blur-md bg-white/[0.03]",
                    task.priority === "high" && "text-red-400 border-red-400/30",
                    task.priority === "medium" && "text-yellow-400 border-yellow-400/30",
                    task.priority === "low" && "text-blue-400 border-blue-400/30"
                  )}
                >
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </Badge>
              )}

              {task.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs text-white/50 border-white/[0.15] bg-white/[0.03] backdrop-blur-md"
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-white/10"
              >
                <MoreVertical className="h-4 w-4 text-white/60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-black/80 backdrop-blur-3xl border-white/20">
              <DropdownMenuItem
                onClick={() => setEditingTask(task)}
                className="text-white/80 hover:text-white focus:text-white focus:bg-white/10"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => duplicateTask(task)}
                className="text-white/80 hover:text-white focus:text-white focus:bg-white/10"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => deleteTask(task.id)}
                className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
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

  // Filter out future groups when not showing future tasks
  const visibleGroups = viewFilter === "today" && !showFutureTasks
    ? ['overdue', 'today', 'noDate']
    : viewFilter === "week"
      ? ['overdue', 'today', 'tomorrow', 'thisWeek', 'noDate']
      : Object.keys(groupedTasks);

  return (
    <div
      className={cn(
        "w-full md:w-80 h-full flex flex-col",
        "bg-black/30 backdrop-blur-3xl",
        "border-r border-white/[0.08]",
        "shadow-2xl",
        isFloating && "rounded-2xl border",
        className
      )}
      style={{
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
      }}
    >
      {/* Header with extra frosted glass effect */}
      <div className="flex-shrink-0 p-4 border-b border-white/[0.08] bg-white/[0.02]">
        <div className="flex items-center justify-between mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="font-semibold text-lg text-white/90 hover:bg-white/[0.05] hover:text-white p-2"
              >
                {currentCategory}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-black/90 backdrop-blur-3xl border-white/20">
              <DropdownMenuLabel className="text-white/60">Categories</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {availableCategories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onSelect={() => setCurrentCategory(category)}
                  className="text-white/80 hover:text-white focus:text-white focus:bg-white/10"
                >
                  <ListTodo className="h-4 w-4 mr-2" />
                  {category}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onSelect={handleAddNewCategory}
                className="text-white/80 hover:text-white focus:text-white focus:bg-white/10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStats(!showStats)}
              className="h-8 w-8 text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBulkCreate(true)}
              className="h-8 w-8 text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
            >
              <Repeat className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={() => setShowAddTask(true)}
              className="h-8 w-8 bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.08]"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats Panel with enhanced glass effect */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-white/[0.03] backdrop-blur-md border border-white/[0.08]">
                  <p className="text-2xl font-bold text-white/90">{stats.pending}</p>
                  <p className="text-xs text-white/50">Pending</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-400/[0.05] backdrop-blur-md border border-green-400/20">
                  <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                  <p className="text-xs text-white/50">Completed</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-red-400/[0.05] backdrop-blur-md border border-red-400/20">
                  <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
                  <p className="text-xs text-white/50">Overdue</p>
                </div>
              </div>
              <Progress value={stats.completionRate} className="h-2 bg-white/[0.05]" />
              <p className="text-xs text-white/50 mt-1 text-center">
                {stats.completionRate}% Complete
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Filter */}
        <div className="flex items-center gap-2 mb-3 p-1 bg-white/[0.03] rounded-lg">
          <ToggleGroup
            type="single"
            value={viewFilter}
            onValueChange={(value) => value && setViewFilter(value as ViewFilter)}
            className="flex-1"
          >
            <ToggleGroupItem
              value="today"
              className="flex-1 data-[state=on]:bg-white/[0.1] text-white/60 data-[state=on]:text-white"
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Today
            </ToggleGroupItem>
            <ToggleGroupItem
              value="week"
              className="flex-1 data-[state=on]:bg-white/[0.1] text-white/60 data-[state=on]:text-white"
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Week
            </ToggleGroupItem>
            <ToggleGroupItem
              value="all"
              className="flex-1 data-[state=on]:bg-white/[0.1] text-white/60 data-[state=on]:text-white"
            >
              <CalendarRange className="h-4 w-4 mr-1" />
              All
            </ToggleGroupItem>
          </ToggleGroup>

          {viewFilter === "today" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFutureTasks(!showFutureTasks)}
              className={cn(
                "text-white/60 hover:text-white hover:bg-white/[0.05]",
                showFutureTasks && "bg-white/[0.05] text-white"
              )}
            >
              {showFutureTasks ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="ml-1 text-xs">Future</span>
            </Button>
          )}
        </div>

        {/* Search and Filter with glass effect */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/30" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/[0.03] border-white/[0.08] text-white/90 placeholder:text-white/30 focus:bg-white/[0.05] focus:border-white/[0.15]"
            />
          </div>

          <div className="flex gap-2">
            <Select value={filterPriority || "all"} onValueChange={(v) => setFilterPriority(v === "all" ? null : v)}>
              <SelectTrigger className="flex-1 bg-white/[0.03] border-white/[0.08] text-white/90">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-3xl border-white/20">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {allTags.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/[0.03] border-white/[0.08] text-white/90 hover:bg-white/[0.05]">
                    <Tag className="h-4 w-4 mr-1" />
                    Tags
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 bg-black/90 backdrop-blur-3xl border-white/20 z-[100]">
                  <div className="space-y-2">
                    {allTags.map(tag => (
                      <label key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTags([...selectedTags, tag]);
                            } else {
                              setSelectedTags(selectedTags.filter(t => t !== tag));
                            }
                          }}
                        />
                        <span className="text-sm text-white/80">{tag}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      {/* Task List with scroll area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Show filtered groups only */}
          {visibleGroups.map((groupKey) => {
            const groupTasks = groupedTasks[groupKey];
            if (!groupTasks || groupTasks.length === 0) return null;

            const groupConfig = {
              overdue: { icon: AlertCircle, color: "text-red-400", label: "Overdue" },
              today: { icon: Sparkles, color: "text-yellow-400", label: "Today" },
              tomorrow: { icon: CalendarIcon, color: "text-blue-400", label: "Tomorrow" },
              thisWeek: { icon: CalendarDays, color: "text-purple-400", label: "This Week" },
              nextWeek: { icon: CalendarRange, color: "text-indigo-400", label: "Next Week" },
              later: { icon: CalendarIcon, color: "text-white/60", label: "Later" },
              noDate: { icon: ListTodo, color: "text-white/60", label: "No Date" },
            }[groupKey] || { icon: CalendarIcon, color: "text-white/60", label: groupKey };

            const Icon = groupConfig.icon;

            return (
              <div key={groupKey}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("h-4 w-4", groupConfig.color)} />
                  <span className="text-sm font-medium text-white/80">{groupConfig.label}</span>
                  <Badge className={cn("ml-auto backdrop-blur-md",
                    groupKey === "overdue" && "bg-red-400/10 text-red-400 border-red-400/20",
                    groupKey === "today" && "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
                    groupKey === "tomorrow" && "bg-blue-400/10 text-blue-400 border-blue-400/20",
                    groupKey === "thisWeek" && "bg-purple-400/10 text-purple-400 border-purple-400/20",
                    (!["overdue", "today", "tomorrow", "thisWeek"].includes(groupKey)) && "bg-white/[0.05] text-white/60 border-white/[0.08]"
                  )}>
                    {groupTasks.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <AnimatePresence>
                    {groupTasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {incompleteTasks.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No tasks yet. Add your first task!</p>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <Collapsible
              open={showCompletedTasks}
              onOpenChange={setShowCompletedTasks}
              className="pt-4 border-t border-white/[0.08]"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 group">
                <div className="flex items-center gap-2">
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 text-white/50 transition-transform",
                      showCompletedTasks && "rotate-90"
                    )}
                  />
                  <span className="text-sm font-medium text-white/50">
                    Completed ({completedTasks.length})
                  </span>
                </div>
                {completedTasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      archiveCompletedTasks();
                    }}
                    className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
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

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={showAddTask}
        onOpenChange={setShowAddTask}
        currentCategory={currentCategory}
        onTaskAdded={handleTaskAdded}
      />

      {/* Bulk Create Dialog with enhanced glass and fixed z-index */}
      <Dialog open={showBulkCreate} onOpenChange={setShowBulkCreate}>
        <DialogContent className="sm:max-w-[500px] bg-black/90 backdrop-blur-3xl border-white/20 z-[200]">
          <DialogHeader>
            <DialogTitle className="text-white">Create Recurring Tasks</DialogTitle>
            <DialogDescription className="text-white/60">
              Create the same task for multiple days
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-title" className="text-white/80">Task Title</Label>
              <Input
                id="bulk-title"
                placeholder="e.g., Drink water, Exercise, Take medication"
                value={bulkTaskTitle}
                onChange={(e) => setBulkTaskTitle(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-description" className="text-white/80">Description (Optional)</Label>
              <Textarea
                id="bulk-description"
                placeholder="Add details..."
                value={bulkTaskDescription}
                onChange={(e) => setBulkTaskDescription(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/80">Start Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/15">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(bulkStartDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black/90 backdrop-blur-3xl border-white/20 z-[300]" align="start">
                    <Calendar
                      mode="single"
                      selected={bulkStartDate}
                      onSelect={(date) => date && setBulkStartDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">End Date</Label>
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start bg-white/10 border-white/20 text-white hover:bg-white/15">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(bulkEndDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black/90 backdrop-blur-3xl border-white/20 z-[300]" align="start">
                    <Calendar
                      mode="single"
                      selected={bulkEndDate}
                      onSelect={(date) => date && setBulkEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bulk-time" className="text-white/80">Time</Label>
                <Input
                  id="bulk-time"
                  type="time"
                  value={bulkTaskTime}
                  onChange={(e) => setBulkTaskTime(e.target.value)}
                  className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-white/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-priority" className="text-white/80">Priority</Label>
                <Select
                  value={bulkTaskPriority}
                  onValueChange={(v) => setBulkTaskPriority(v as 'low' | 'medium' | 'high')}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-3xl border-white/20 z-[300]">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-white/[0.05] backdrop-blur-md p-3 rounded-lg border border-white/[0.08]">
              <p className="text-sm text-white/60">
                This will create {Math.ceil((bulkEndDate.getTime() - bulkStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} tasks
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkCreate(false)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Cancel
            </Button>
            <Button
              onClick={createBulkTasks}
              disabled={!bulkTaskTitle.trim()}
              className="bg-white/20 text-white hover:bg-white/30"
            >
              Create Tasks
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog with fixed z-index */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent className="bg-black/90 backdrop-blur-3xl border-white/20 z-[200]">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                placeholder="Task title"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30"
              />
              <Textarea
                value={editingTask.description || ""}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                placeholder="Description"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingTask(null)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => updateTask(editingTask)}
                  className="bg-white/20 text-white hover:bg-white/30"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TaskManager;