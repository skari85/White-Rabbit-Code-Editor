'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, FileText, Code, Zap, Clock } from 'lucide-react';

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
    <div className={`bg-gray-900 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Live Coding Engine</h3>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isActive ? 'destructive' : 'default'}
            size="sm"
            onClick={toggleLiveCoding}
            className="flex items-center gap-1"
          >
            {isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isActive ? 'Stop' : 'Start'}
          </Button>
          
          {tasks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearTasks}
              className="text-gray-300"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Typing Speed Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Typing Speed: {typingSpeed} chars/sec
        </label>
        <input
          type="range"
          min="10"
          max="200"
          value={typingSpeed}
          onChange={(e) => setTypingSpeed(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Current Task */}
      {currentTask && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 font-medium">
              {currentTask.type === 'create' ? 'Creating' : 'Updating'}: {currentTask.filename}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentTask.progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {Math.round(currentTask.progress)}% complete
          </div>
        </div>
      )}

      {/* Task Queue */}
      <div className="space-y-2">
        {/* Pending Tasks */}
        {pendingTasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm flex-1">{task.filename}</span>
            <Badge variant="outline" className="text-xs">
              {task.type}
            </Badge>
            <Clock className="w-3 h-3 text-gray-500" />
          </div>
        ))}

        {/* Completed Tasks */}
        {completedTasks.slice(-3).map(task => (
          <div key={task.id} className="flex items-center gap-3 p-2 bg-gray-800/50 rounded opacity-60">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm flex-1">{task.filename}</span>
            <Badge variant="outline" className="text-xs">
              ✓ {task.type}
            </Badge>
          </div>
        ))}
      </div>

      {/* Stats */}
      {tasks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Pending: {pendingTasks.length}</span>
            <span>Active: {activeTasks.length}</span>
            <span>Completed: {completedTasks.length}</span>
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No coding tasks in queue</p>
          <p className="text-xs mt-1">AI will add tasks here when generating code</p>
        </div>
      )}
    </div>
  );
};

export default LiveCodingEngine;
export { type CodingTask };
