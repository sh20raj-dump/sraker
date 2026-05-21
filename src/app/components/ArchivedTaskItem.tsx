"use client";

import { useState } from "react";
import { Task } from "../services/storageService";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface ArchivedTaskItemProps {
  task: Task;
  onDelete: (id: number) => void;
}

export default function ArchivedTaskItem({ task, onDelete }: ArchivedTaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format the archived date
  const archivedDate = task.archivedAt 
    ? new Date(task.archivedAt).toLocaleDateString() 
    : '';
  
  // Truncate text if it's too long
  const shouldTruncate = task.text.length > 120;
  const displayText = isExpanded || !shouldTruncate ? task.text : task.text.substring(0, 120) + "...";

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
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
        
        {archivedDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Archived on {archivedDate}
          </p>
        )}
      </div>
      
      <Button
        onClick={() => onDelete(task.id)}
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
