// components/types.ts (or in TaskManager.tsx if you prefer)
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string; // or Date type if you handle Date objects
  completed: boolean;
}
