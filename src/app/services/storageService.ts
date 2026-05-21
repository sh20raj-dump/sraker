import { RecurringInterval } from "./taskService";

// Define the Workspace type
export type Workspace = 'default' | 'study' | 'work' | 'memory';

// Define the Task interface
export interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
  workspace: Workspace;
  recurring?: {
    interval: RecurringInterval;
    nextDate: string;
  };
  archived?: boolean;
  archivedAt?: string;
}

const STORAGE_KEY = 'tasks';

// Get tasks from localStorage
export const getTasks = (): Task[] => {
  try {
    const tasks = localStorage.getItem(STORAGE_KEY);
    return tasks ? JSON.parse(tasks) : [];
  } catch (error) {
    console.error('Error reading tasks from localStorage:', error);
    return [];
  }
};

// Save tasks to localStorage
export const saveTasks = (tasks: Task[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving tasks to localStorage:', error);
  }
};

// Add a new task
export const addTask = (task: Task): void => {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
};

// Update an existing task
export const updateTask = (updatedTask: Task): void => {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    saveTasks(tasks);
  }
};

// Archive a task
export const archiveTask = (taskId: number): void => {
  const tasks = getTasks();
  const index = tasks.findIndex(task => task.id === taskId);
  if (index !== -1) {
    tasks[index] = {
      ...tasks[index],
      archived: true,
      archivedAt: new Date().toISOString()
    };
    saveTasks(tasks);
  }
};

// Get archived tasks
export const getArchivedTasks = (workspace?: Workspace): Task[] => {
  const tasks = getTasks();
  return tasks.filter(task => task.archived && (!workspace || task.workspace === workspace));
};

// Get active tasks
export const getActiveTasks = (workspace?: Workspace): Task[] => {
  const tasks = getTasks();
  return tasks.filter(task => !task.archived && (!workspace || task.workspace === workspace));
};

// Workspace management
const WORKSPACE_KEY = 'currentWorkspace';

export const getCurrentWorkspace = (): Workspace => {
  try {
    const workspace = localStorage.getItem(WORKSPACE_KEY);
    return (workspace as Workspace) || 'default';
  } catch (error) {
    console.error('Error reading workspace from localStorage:', error);
    return 'default';
  }
};

export const setCurrentWorkspace = (workspace: Workspace): void => {
  try {
    localStorage.setItem(WORKSPACE_KEY, workspace);
  } catch (error) {
    console.error('Error saving workspace to localStorage:', error);
  }
};

export const getWorkspaces = (): Workspace[] => {
  return ['default', 'study', 'work', 'memory'];
};

export const getWorkspaceDisplayName = (workspace: Workspace): string => {
  const names: Record<Workspace, string> = {
    default: 'Default',
    study: 'Study',
    work: 'Work',
    memory: 'Memory'
  };
  return names[workspace];
};

// Migrate existing tasks to have workspace property
export const migrateTasksToWorkspace = (): void => {
  const tasks = getTasks();
  let hasChanged = false;
  
  const updatedTasks = tasks.map(task => {
    if (!task.workspace) {
      hasChanged = true;
      return { ...task, workspace: 'default' as Workspace };
    }
    return task;
  });
  
  if (hasChanged) {
    saveTasks(updatedTasks);
  }
};