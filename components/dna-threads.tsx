"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PersonalityMode } from '@/lib/personality-system';
import { GitBranch, Clock, Trash2, Eye, Copy, RotateCcw, GitMerge } from 'lucide-react';

export interface CodeGeneration {
  id: string;
  timestamp: Date;
  code: string;
  description: string;
  personality: PersonalityMode;
  parentId?: string;
  isRejected?: boolean;
  fileName: string;
}

export interface CodeBranch {
  id: string;
  name: string;
  generations: CodeGeneration[];
  color: string;
}

interface DNAThreadsProps {
  generations: CodeGeneration[];
  branches: CodeBranch[];
  currentGenerationId?: string;
  onRewind: (generationId: string) => void;
  onFork: (generationId: string) => void;
  onDelete: (generationId: string) => void;
  onPreview: (generationId: string) => void;
  personality: PersonalityMode;
}

export function DNAThreads({
  generations,
  branches,
  currentGenerationId,
  onRewind,
  onFork,
  onDelete,
  onPreview,
  personality
}: DNAThreadsProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [expandedGenerations, setExpandedGenerations] = useState<Set<string>>(new Set());

  const toggleGeneration = (id: string) => {
    const newExpanded = new Set(expandedGenerations);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGenerations(newExpanded);
  };

  const getPersonalityColor = (gen: CodeGeneration) => {
    return gen.personality === 'hex' ? '#6c2fff' : '#00ffe1';
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const buildGenerationTree = () => {
    const tree: { [key: string]: CodeGeneration[] } = {};
    const roots: CodeGeneration[] = [];

    generations.forEach(gen => {
      if (gen.parentId) {
        if (!tree[gen.parentId]) tree[gen.parentId] = [];
        tree[gen.parentId].push(gen);
      } else {
        roots.push(gen);
      }
    });

    return { tree, roots };
  };

  const renderGeneration = (generation: CodeGeneration, depth = 0) => {
    const isExpanded = expandedGenerations.has(generation.id);
    const isCurrent = currentGenerationId === generation.id;
    const hasChildren = generations.some(g => g.parentId === generation.id);

    return (
      <div key={generation.id} className="relative">
        {/* Connection line */}
        {depth > 0 && (
          <div
            className="absolute left-4 top-0 w-px h-6 bg-gray-300"
            style={{ left: `${depth * 20 - 8}px` }}
          />
        )}
        
        <div
          className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
            isCurrent 
              ? 'bg-blue-50 border-2 border-blue-200' 
              : generation.isRejected
              ? 'bg-red-50 border border-red-200 opacity-60'
              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {/* Branch indicator */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: getPersonalityColor(generation) }}
          />
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">
                  {generation.personality === 'hex' ? '🔮' : '⚡'} {generation.personality.toUpperCase()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {generation.fileName}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                {getTimeAgo(generation.timestamp)}
              </span>
              {isCurrent && (
                <Badge variant="default" className="text-xs bg-blue-500">
                  Current
                </Badge>
              )}
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-700 mb-2">
              {generation.description}
            </p>
            
            {/* Code preview */}
            {isExpanded && (
              <div className="bg-gray-900 rounded p-3 mb-2">
                <pre className="text-xs text-green-400 overflow-x-auto">
                  {generation.code.slice(0, 200)}
                  {generation.code.length > 200 && '...'}
                </pre>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleGeneration(generation.id)}
                className="h-6 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                {isExpanded ? 'Hide' : 'Show'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRewind(generation.id)}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Rewind
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFork(generation.id)}
                className="h-6 px-2 text-xs"
              >
                <GitBranch className="w-3 h-3 mr-1" />
                Fork
              </Button>
              
              {!isCurrent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(generation.id)}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Render children */}
        {hasChildren && (
          <div className="mt-2">
            {generations
              .filter(g => g.parentId === generation.id)
              .map(child => renderGeneration(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const { tree, roots } = buildGenerationTree();

  return (
    <div className="w-80 bg-white/30 backdrop-blur border-l border-gray-200/40 flex flex-col h-full shadow-none" style={{boxShadow:'none', background:'rgba(255,255,255,0.12)'}}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200/40">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-70 border border-gray-300/30 bg-white/40 backdrop-blur"
            style={{
              background: personality === 'hex' ? 'rgba(108,47,255,0.18)' : 'rgba(0,255,225,0.18)',
              color: personality === 'hex' ? '#6c2fff' : '#00ffe1',
              boxShadow: 'none'
            }}
          >
            🧬
          </div>
          <h3 className="font-semibold text-gray-700/80">DNA Threads</h3>
        </div>
        
        <div className="text-xs text-gray-500/80">
          {generations.length} generations • {branches.length} branches
        </div>
      </div>
      
      {/* Branch selector */}
      {branches.length > 1 && (
        <div className="p-3 border-b border-gray-200/40 bg-white/20">
          <div className="text-xs font-medium text-gray-700 mb-2">Branches</div>
          <div className="flex flex-wrap gap-1">
            {branches.map(branch => (
              <Button
                key={branch.id}
                variant={selectedBranch === branch.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBranch(branch.id)}
                className="h-6 px-2 text-xs"
                style={{
                  borderColor: branch.color,
                  color: selectedBranch === branch.id ? 'white' : branch.color,
                  backgroundColor: selectedBranch === branch.id ? branch.color : 'transparent'
                }}
              >
                <GitBranch className="w-3 h-3 mr-1" />
                {branch.name}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {generations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No code generations yet</p>
              <p className="text-xs">Start coding to see your thought trails</p>
            </div>
          ) : (
            roots.map(root => renderGeneration(root))
          )}
        </div>
      </ScrollArea>
      
      {/* Stats footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-purple-600">
              {generations.filter(g => g.personality === 'hex').length}
            </div>
            <div className="text-xs text-gray-500">HEX generations</div>
          </div>
          <div>
            <div className="text-lg font-bold text-cyan-600">
              {generations.filter(g => g.personality === 'kex').length}
            </div>
            <div className="text-xs text-gray-500">KEX generations</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing DNA threads
export function useDNAThreads() {
  const [generations, setGenerations] = useState<CodeGeneration[]>([]);
  const [branches, setBranches] = useState<CodeBranch[]>([
    { id: 'main', name: 'main', generations: [], color: '#6366f1' }
  ]);
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);

  const addGeneration = (
    code: string,
    description: string,
    personality: PersonalityMode,
    fileName: string,
    parentId?: string
  ) => {
    const generation: CodeGeneration = {
      id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      code,
      description,
      personality,
      parentId,
      fileName
    };

    setGenerations(prev => [...prev, generation]);
    setCurrentGenerationId(generation.id);
    return generation.id;
  };

  const rewindTo = (generationId: string) => {
    setCurrentGenerationId(generationId);
  };

  const forkFrom = (generationId: string) => {
    const branchId = `branch-${Date.now()}`;
    const newBranch: CodeBranch = {
      id: branchId,
      name: `Branch ${branches.length}`,
      generations: [],
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    };
    
    setBranches(prev => [...prev, newBranch]);
    return branchId;
  };

  const deleteGeneration = (generationId: string) => {
    setGenerations(prev => prev.filter(g => g.id !== generationId));
    if (currentGenerationId === generationId) {
      setCurrentGenerationId(null);
    }
  };

  const markAsRejected = (generationId: string) => {
    setGenerations(prev => 
      prev.map(g => 
        g.id === generationId ? { ...g, isRejected: true } : g
      )
    );
  };

  return {
    generations,
    branches,
    currentGenerationId,
    addGeneration,
    rewindTo,
    forkFrom,
    deleteGeneration,
    markAsRejected
  };
}
