'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, ListTodo, Plus, Trash2, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Task {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const TASKS_KEY = 'wr-workspace-tasks';

function loadTasks(categoryId: string): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const all: Record<string, Task[]> = JSON.parse(raw);
    return all[categoryId] ?? [];
  } catch {
    return [];
  }
}

function persistTasks(categoryId: string, tasks: Task[]) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    const all: Record<string, Task[]> = raw ? JSON.parse(raw) : {};
    all[categoryId] = tasks;
    localStorage.setItem(TASKS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TaskListPanelProps {
  categoryId: string;
  className?: string;
}

export default function TaskListPanel({
  categoryId,
  className = '',
}: TaskListPanelProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  // Load on mount and category change
  useEffect(() => {
    setTasks(loadTasks(categoryId));
  }, [categoryId]);

  // Persist on change
  useEffect(() => {
    if (categoryId) persistTasks(categoryId, tasks);
  }, [tasks, categoryId]);

  const addTask = useCallback(() => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    const task: Task = {
      id: `t-${Date.now()}`,
      text: trimmed,
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [...prev, task]);
    setNewText('');
    setAdding(false);
  }, [newText]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className={`flex flex-col h-full bg-zinc-950 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <ListTodo className="w-3.5 h-3.5" />
          <span>Tasks</span>
          {tasks.length > 0 && (
            <span className="text-zinc-600 ml-0.5">
              ({doneCount}/{tasks.length})
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
          onClick={() => setAdding(true)}
          title="Add task"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-2 space-y-1">
          {tasks.length === 0 && !adding && (
            <p className="text-zinc-600 italic text-xs px-2 py-4 text-center">
              No tasks yet. Click + to add one.
            </p>
          )}

          {tasks.map((task) => (
            <div
              key={task.id}
              className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800/50 transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 shrink-0"
              >
                {task.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
                )}
              </button>
              <span
                className={`flex-1 text-xs leading-relaxed ${
                  task.done
                    ? 'line-through text-zinc-600'
                    : 'text-zinc-300'
                }`}
              >
                {task.text}
              </span>
              <Trash2
                className="w-3 h-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 cursor-pointer text-zinc-500"
                onClick={() => deleteTask(task.id)}
              />
            </div>
          ))}

          {/* Add task inline */}
          {adding && (
            <div className="flex items-center gap-1 px-1 py-1">
              <Input
                autoFocus
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTask();
                  if (e.key === 'Escape') setAdding(false);
                }}
                placeholder="Task description…"
                className="h-7 text-xs bg-zinc-800 border-zinc-700 flex-1"
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={addTask}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => setAdding(false)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
