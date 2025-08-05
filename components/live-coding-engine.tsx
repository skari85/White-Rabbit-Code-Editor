'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, FileText, Code, Zap, Clock, ChevronDown, ChevronUp, Minimize2 } from 'lucide-react';

interface LiveCodingEngineProps {
  onFileCreate: (name: string, content: string, type?: string) => void;
  onFileUpdate: (name: string, content: string) => void;
  onFileSelect: (name: string) => void;
  className?: string;
}

interface CodingTask {
  id: string;
  type: 'create' | 'update';
  filename: string;
  content: string;
  status: 'pending' | 'typing' | 'complete';
  progress: number;
}

const LiveCodingEngine: React.FC<LiveCodingEngineProps> = ({
  onFileCreate,
  onFileUpdate,
  onFileSelect,
  className = ''
}) => {
  const [tasks, setTasks] = useState<CodingTask[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [currentTask, setCurrentTask] = useState<CodingTask | null>(null);
  const [typingSpeed, setTypingSpeed] = useState(50); // characters per second
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Add a new coding task
  const addTask = useCallback((type: 'create' | 'update', filename: string, content: string) => {
    const task: CodingTask = {
      id: `${type}-${filename}-${Date.now()}`,
      type,
      filename,
      content,
      status: 'pending',
      progress: 0
    };

    setTasks(prev => [...prev, task]);
    return task.id;
  }, []);

  // Execute live coding with typing animation
  const executeLiveCoding = useCallback(async (task: CodingTask) => {
    setCurrentTask(task);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'typing' } : t));

    // Select the file first
    onFileSelect(task.filename);

    // If it's a create task, create empty file first
    if (task.type === 'create') {
      onFileCreate(task.filename, '', getFileType(task.filename));
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
    }

    // Type the content character by character
    const content = task.content;
    let currentContent = '';
    
    for (let i = 0; i < content.length; i++) {
      currentContent += content[i];
      
      // Update the file with current content
      if (task.type === 'create') {
        onFileCreate(task.filename, currentContent, getFileType(task.filename));
      } else {
        onFileUpdate(task.filename, currentContent);
      }

      // Update progress
      const progress = ((i + 1) / content.length) * 100;
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, progress } : t
      ));

      // Wait based on typing speed
      const delay = 1000 / typingSpeed;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Add some natural variation to typing speed
      if (Math.random() < 0.1) {
        await new Promise(resolve => setTimeout(resolve, delay * 2));
      }
    }

    // Mark task as complete
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'complete', progress: 100 } : t
    ));
    
    setCurrentTask(null);
  }, [onFileCreate, onFileUpdate, onFileSelect, typingSpeed]);

  // Process tasks queue
  useEffect(() => {
    if (!isActive || currentTask) return;

    const pendingTask = tasks.find(t => t.status === 'pending');
    if (pendingTask) {
      executeLiveCoding(pendingTask);
    }
  }, [tasks, isActive, currentTask, executeLiveCoding]);

  // Get file type from filename
  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'jsx': return 'javascript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'py': return 'python';
      default: return 'text';
    }
  };

  // Start/stop live coding
  const toggleLiveCoding = () => {
    setIsActive(!isActive);
    if (isActive) {
      // Stop current task
      setCurrentTask(null);
      setTasks(prev => prev.map(t => ({ ...t, status: 'pending', progress: 0 })));
    }
  };

  // Clear all tasks
  const clearTasks = () => {
    setTasks([]);
    setCurrentTask(null);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'typing': return 'bg-blue-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const activeTasks = tasks.filter(t => t.status === 'typing');
  const completedTasks = tasks.filter(t => t.status === 'complete');

  return (
    <div className={`bg-gray-800/95 backdrop-blur-sm border-t border-gray-600 transition-all duration-300 ${
      isMinimized ? 'h-12' : isCollapsed ? 'h-16' : 'h-auto max-h-80'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-700/50">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-medium text-gray-200">Live Coding</h3>
          {!isMinimized && (
            <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
              {isActive ? 'Active' : 'Idle'}
            </Badge>
          )}
          {tasks.length > 0 && !isMinimized && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-gray-300">
              {tasks.length} tasks
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!isMinimized && (
            <>
              <Button
                variant={isActive ? 'destructive' : 'default'}
                size="sm"
                onClick={toggleLiveCoding}
                className="h-6 px-2 text-xs"
              >
                {isActive ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>

              {tasks.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTasks}
                  className="h-6 px-2 text-xs text-gray-400 hover:text-gray-200"
                >
                  Clear
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
              >
                {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content - only show if not collapsed or minimized */}
      {!isCollapsed && !isMinimized && (
        <div className="p-3 pt-0 overflow-y-auto max-h-64">{/* Rest of content will go here */}

          {/* Typing Speed Control */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Speed: {typingSpeed} chars/sec
            </label>
            <input
              type="range"
              min="10"
              max="200"
              value={typingSpeed}
              onChange={(e) => setTypingSpeed(Number(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Current Task */}
          {currentTask && (
            <div className="mb-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Code className="w-3 h-3 text-blue-400" />
                <span className="text-blue-300 text-xs font-medium">
                  {currentTask.type === 'create' ? 'Creating' : 'Updating'}: {currentTask.filename}
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${currentTask.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(currentTask.progress)}% complete
              </div>
            </div>
          )}

          {/* Task Queue */}
          <div className="space-y-1">
            {/* Pending Tasks */}
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 p-1.5 bg-gray-700/30 rounded text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`} />
                <FileText className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300 flex-1 truncate">{task.filename}</span>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {task.type}
                </Badge>
                <Clock className="w-3 h-3 text-gray-500" />
              </div>
            ))}

            {/* Completed Tasks */}
            {completedTasks.slice(-2).map(task => (
              <div key={task.id} className="flex items-center gap-2 p-1.5 bg-gray-700/20 rounded opacity-60 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(task.status)}`} />
                <FileText className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300 flex-1 truncate">{task.filename}</span>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  ✓
                </Badge>
              </div>
            ))}
          </div>

          {/* Stats */}
          {tasks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Queue: {pendingTasks.length}</span>
                <span>Done: {completedTasks.length}</span>
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Code className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Ready for AI tasks</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveCodingEngine;
export { type CodingTask };
