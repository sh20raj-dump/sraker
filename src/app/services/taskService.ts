import { Task, Workspace } from "./storageService";

export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly' | number; // number for custom days

export interface RecurringTaskConfig {
    interval: RecurringInterval;
    nextDate: string; // ISO string
}

// Create a new task
export const createTask = (text: string, workspace: Workspace = 'default', recurringConfig?: RecurringTaskConfig): Task => {
    return {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
        workspace,
        recurring: recurringConfig,
    };
};

// Check if a task is recurring
export const isRecurring = (task: Task): boolean => {
    return !!task.recurring;
};

// Calculate the next occurrence date for a recurring task
export const getNextOccurrence = (interval: RecurringInterval, fromDate: Date = new Date()): Date => {
    const nextDate = new Date(fromDate);

    if (typeof interval === 'number') {
        // Custom interval in days
        nextDate.setDate(nextDate.getDate() + interval);
    } else {
        switch (interval) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }
    }

    return nextDate;
};

// Generate a new instance of a recurring task
export const generateRecurringTask = (originalTask: Task): Task | null => {
    if (!originalTask.recurring) return null;

    const now = new Date();
    const nextDate = new Date(originalTask.recurring.nextDate);

    // Only generate if we've passed the next date
    if (now >= nextDate) {
        // Create a new task instance
        const newTask: Task = {
            ...originalTask,
            id: Date.now(),
            completed: false,
            createdAt: now.toISOString(),
        };

        // Update the original task's next occurrence
        const updatedNextDate = getNextOccurrence(originalTask.recurring.interval, nextDate);
        if (originalTask.recurring) {
            originalTask.recurring.nextDate = updatedNextDate.toISOString();
        }

        return newTask;
    }

    return null;
};

// Get all tasks including generated recurring tasks
export const getAllTasks = (tasks: Task[]): Task[] => {
    const result: Task[] = [];

    tasks.forEach(task => {
        result.push(task);

        // If it's a recurring task, generate new instances if needed
        if (isRecurring(task)) {
            const newTask = generateRecurringTask(task);
            if (newTask) {
                result.push(newTask);
            }
        }
    });

    return result;
};

// Format interval for display
export const formatInterval = (interval: RecurringInterval): string => {
    if (typeof interval === 'number') {
        if (interval === 1) return 'Daily';
        if (interval === 7) return 'Weekly';
        return `Every ${interval} days`;
    }

    switch (interval) {
        case 'daily': return 'Daily';
        case 'weekly': return 'Weekly';
        case 'monthly': return 'Monthly';
        case 'yearly': return 'Yearly';
        default: return String(interval);
    }
};