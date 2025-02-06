import { storage } from "wxt/storage";
import { Task } from "./types"; // Adjust path if needed

export const taskManagerHiddenStorage = storage.defineItem<boolean>(
  "local:taskManagerHidden",
  {
    fallback: false,
    version: 1,
  }
);

// Define storage to hold tasks categorized by category name
export const categoryTasksStorage = storage.defineItem<{
  [category: string]: Task[];
}>("local:categoryTasks", {
  fallback: {
    Todos: [], // Default category: Todos
  },
  version: 1,
});
