"use client";

import { useState } from "react";
import { Task } from "../services/storageService";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Archive, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onArchive: (id: number) => void;
}

export default function TaskItem({ task, onToggle, onArchive }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Truncate text if it's too long
  const shouldTruncate = task.text.length > 120;
  const displayText = isExpanded || !shouldTruncate ? task.text : task.text.substring(0, 120) + "...";

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-relaxed ${
          task.completed 
            ? "line-through text-muted-foreground" 
            : "text-card-foreground"
        }`}>
          {displayText}
        </p>
        
        {shouldTruncate && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground mt-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show more
              </>
            )}
          </Button>
        )}
      </div>
      
      <Button
        onClick={() => onArchive(task.id)}
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
      >
        <Archive className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}