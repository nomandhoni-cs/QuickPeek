// components/types.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
  reminder?: string;
  subtasks?: SubTask[];
  color?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}