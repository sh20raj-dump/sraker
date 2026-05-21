"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Task, 
  Workspace,
  getActiveTasks, 
  getArchivedTasks,
  saveTasks,
  getCurrentWorkspace,
  migrateTasksToWorkspace
} from "./services/storageService";
import { createTask } from "./services/taskService";
import TaskItem from "./components/TaskItem";
import WorkspaceSelector from "./components/WorkspaceSelector";
import ArchivedTaskItem from "./components/ArchivedTaskItem";
import { useTheme } from "next-themes";
import { groupTasksByDate, formatDate } from "./utils/taskUtils";
import { speechService } from "./services/speechService";
import { 
  Archive, 
  Sun, 
  Moon, 
  Mic, 
  Plus,
  Download,
  Check,
  Send
} from 'lucide-react';

export default function Home() {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>('default');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [newTask, setNewTask] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const { theme, setTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize workspace and migrate existing tasks
  useEffect(() => {
    migrateTasksToWorkspace();
    const workspace = getCurrentWorkspace();
    setCurrentWorkspace(workspace);
  }, []);

  // Load tasks from localStorage when workspace changes
  useEffect(() => {
    const activeTasks = getActiveTasks(currentWorkspace);
    const archived = getArchivedTasks(currentWorkspace);
    setTasks(activeTasks);
    setArchivedTasks(archived);
  }, [currentWorkspace]);

  // PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save tasks to localStorage whenever active tasks change
  useEffect(() => {
    saveTasks([...tasks, ...archivedTasks]);
  }, [tasks, archivedTasks]);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [tasks]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddTask = () => {
    if (newTask.trim() !== "") {
      const task = createTask(newTask.trim(), currentWorkspace);
      setTasks([...tasks, task]);
      setNewTask("");
    }
  };

  const handleWorkspaceChange = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
  };

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const archiveTask = (id: number) => {
    const taskToArchive = tasks.find(task => task.id === id);
    if (taskToArchive) {
      const updatedTask = {
        ...taskToArchive,
        archived: true,
        archivedAt: new Date().toISOString()
      };
      setTasks(tasks.filter(task => task.id !== id));
      setArchivedTasks([...archivedTasks, updatedTask]);
    }
  };

  const deleteArchivedTask = (id: number) => {
    setArchivedTasks(archivedTasks.filter(task => task.id !== id));
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSpeech = () => {
    if (!speechService.isSupported()) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      speechService.stopRecognition();
      setIsListening(false);
    } else {
      speechService.startRecognition(
        (text) => {
          setNewTask(text);
        },
        (error) => {
          console.error(error);
          alert(error);
          setIsListening(false);
        }
      );
      setIsListening(true);
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  // Group tasks by date
  const groupedTasks = groupTasksByDate(tasks);
  const completedCount = tasks.filter(task => task.completed).length;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasks.length} total • {completedCount} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showInstallPrompt && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleInstallPWA}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Archive className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Archived Tasks ({archivedTasks.length})
                </DialogTitle>
              </DialogHeader>
              {archivedTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-sm">
                  No archived tasks yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {archivedTasks.map((task) => (
                    <ArchivedTaskItem 
                      key={task.id} 
                      task={task} 
                      onDelete={deleteArchivedTask} 
                    />
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="h-8 w-8 p-0"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm">
              Add your first task below. You can type or use voice input.
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-2xl mx-auto">
            {groupedTasks.map(({ date, tasks: dateTasks }) => (
              <div key={date} className="space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider sticky top-0 bg-background py-1">
                  {formatDate(date)}
                </h3>
                <div className="space-y-2">
                  {dateTasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={toggleTask} 
                      onArchive={archiveTask} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a new task..."
                className="pr-10 h-10 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
              />
              <Button
                onClick={handleSpeech}
                variant="ghost"
                size="sm"
                className={`absolute right-1 top-1 h-8 w-8 p-0 ${
                  isListening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleAddTask}
              disabled={!newTask.trim()}
              className="h-10 w-10 p-0 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

 return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b bgcard">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Todo Chat
        </h1>
        <div className="flex gap-2">
          <Dialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full p-2 h-auto">
                <Archive className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                  <Archive className="h-5 w-5" />
                  Archived Tasks
                </DialogTitle>
              </DialogHeader>
              {archivedTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No archived tasks yet.</p>
              ) : (
                <div className="space-y-3">
                  {archivedTasks.map((task) => (
                    <ArchivedTaskItem 
                      key={task.id} 
                      task={task} 
                      onDelete={deleteArchivedTask} 
                    />
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
          <Button variant="ghost" size="sm" className="rounded-full p-2 h-auto">
            <SortAsc className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full p-2 h-auto"
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-muted-foreground mb-4">No tasks yet. Add one below!</p>
            <div className="text-muted-foreground/80 text-sm">
              <p>✨ Tap the mic to speak your task</p>
              <p>✨ Type and send to add tasks</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedTasks.map(({ date, tasks: dateTasks }) => (
              <div key={date} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground pl-1">
                  {formatDate(date)}
                </h3>
                <div className="space-y-3">
                  {dateTasks.map((task) => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={toggleTask} 
                      onArchive={archiveTask} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bgcard">
        <div className="flex gap-2 max-w-md mx-auto">
          <Input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a task..."
            className="flex-grow rounded-full px-4 py-3"
          />
          <Button
            onClick={handleSpeech}
            className={`rounded-full px-4 ${
              speechService.getIsListening() ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleAddTask}
            className="rounded-full px-4 bg-primary hover:bg-primary/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
