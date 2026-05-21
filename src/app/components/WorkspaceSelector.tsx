"use client";

import { 
  Workspace, 
  getWorkspaces, 
  getWorkspaceDisplayName,
  setCurrentWorkspace 
} from '../services/storageService';
import { Briefcase, BookOpen, Home, Brain, ChevronDown } from 'lucide-react';

interface WorkspaceSelectorProps {
  currentWorkspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
}

const workspaceIcons: Record<Workspace, React.ReactNode> = {
  default: <Home className="w-4 h-4" />,
  study: <BookOpen className="w-4 h-4" />,
  work: <Briefcase className="w-4 h-4" />,
  memory: <Brain className="w-4 h-4" />
};

export default function WorkspaceSelector({ currentWorkspace, onWorkspaceChange }: WorkspaceSelectorProps) {
  const workspaces = getWorkspaces();

  const handleWorkspaceChange = (workspace: string) => {
    const newWorkspace = workspace as Workspace;
    setCurrentWorkspace(newWorkspace);
    onWorkspaceChange(newWorkspace);
  };

  return (
    <div className="flex items-center gap-3 mb-6 p-1">
      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-fit">
        Workspace:
      </span>
      <div className="relative">
        <select 
          value={currentWorkspace} 
          onChange={(e) => handleWorkspaceChange(e.target.value)}
          className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
        >
          {workspaces.map((workspace) => (
            <option key={workspace} value={workspace}>
              {getWorkspaceDisplayName(workspace)}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      <div className="flex items-center gap-1 ml-2">
        {workspaceIcons[currentWorkspace]}
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {getWorkspaceDisplayName(currentWorkspace)}
        </span>
      </div>
    </div>
  );
}
