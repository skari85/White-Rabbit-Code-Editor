'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitCommit, 
  GitBranch, 
  GitMerge, 
  GitPullRequest,
  Calendar,
  User,
  MessageSquare,
  RefreshCw,
  Maximize2,
  Minimize2,
  Filter,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GitCommitData {
  hash: string;
  message: string;
  author: string;
  email: string;
  date: Date;
  files: string[];
  parent?: string;
  branch: string;
  tags?: string[];
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

interface GitBranchData {
  name: string;
  current: boolean;
  lastCommit: string;
  ahead: number;
  behind: number;
  color: string;
}

interface GitHistoryVisualizerProps {
  commits?: GitCommitData[];
  branches?: GitBranchData[];
  onCommitSelect?: (commit: GitCommitData) => void;
  onBranchSelect?: (branch: GitBranchData) => void;
  className?: string;
}

// Generate beautiful colors for branches
const generateBranchColors = (branchCount: number): string[] => {
  const baseColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#EC4899', // Pink
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < branchCount; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

// Calculate commit positions for visualization
const calculateCommitPositions = (commits: GitCommitData[], branches: GitBranchData[]) => {
  const branchMap = new Map(branches.map(b => [b.name, b]));
  const commitMap = new Map(commits.map(c => [c.hash, c]));
  
  return commits.map((commit, index) => {
    const branch = branchMap.get(commit.branch);
    const color = branch?.color || '#6B7280';
    
    // Calculate position based on branch and commit order
    const branchIndex = branches.findIndex(b => b.name === commit.branch);
    const xOffset = branchIndex * 120; // Horizontal spacing between branches
    
    return {
      ...commit,
      x: xOffset,
      y: index * 80, // Vertical spacing between commits
      color,
      branchIndex,
      connections: [] as string[]
    };
  });
};

export default function GitHistoryVisualizer({ 
  commits = [], 
  branches = [],
  onCommitSelect,
  onBranchSelect,
  className = ''
}: GitHistoryVisualizerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(0.8);

  // Generate sample data if none provided
  const sampleCommits: GitCommitData[] = useMemo(() => {
    if (commits.length > 0) return commits;
    
    const now = new Date();
    return [
      {
        hash: 'a1b2c3d4',
        message: 'feat: add new authentication system',
        author: 'Alice Developer',
        email: 'alice@example.com',
        date: new Date(now.getTime() - 1000 * 60 * 60 * 2),
        files: ['auth.ts', 'login.tsx', 'middleware.ts'],
        branch: 'main',
        tags: ['v1.2.0'],
        stats: { additions: 150, deletions: 45, total: 195 }
      },
      {
        hash: 'e5f6g7h8',
        message: 'fix: resolve login validation bug',
        author: 'Bob Coder',
        email: 'bob@example.com',
        date: new Date(now.getTime() - 1000 * 60 * 60 * 4),
        files: ['auth.ts', 'validation.ts'],
        branch: 'main',
        stats: { additions: 23, deletions: 12, total: 35 }
      },
      {
        hash: 'i9j0k1l2',
        message: 'feat: implement user dashboard',
        author: 'Alice Developer',
        email: 'alice@example.com',
        date: new Date(now.getTime() - 1000 * 60 * 60 * 6),
        files: ['dashboard.tsx', 'user-service.ts', 'types.ts'],
        branch: 'feature/dashboard',
        stats: { additions: 89, deletions: 0, total: 89 }
      },
      {
        hash: 'm3n4o5p6',
        message: 'docs: update API documentation',
        author: 'Charlie Writer',
        email: 'charlie@example.com',
        date: new Date(now.getTime() - 1000 * 60 * 60 * 8),
        files: ['README.md', 'API.md'],
        branch: 'main',
        stats: { additions: 67, deletions: 23, total: 90 }
      },
      {
        hash: 'q7r8s9t0',
        message: 'refactor: optimize database queries',
        author: 'David Optimizer',
        email: 'david@example.com',
        date: new Date(now.getTime() - 1000 * 60 * 60 * 10),
        files: ['database.ts', 'query-builder.ts'],
        branch: 'main',
        stats: { additions: 34, deletions: 78, total: 112 }
      }
    ];
  }, [commits]);

  const sampleBranches: GitBranchData[] = useMemo(() => {
    if (branches.length > 0) return branches;
    
    const colors = generateBranchColors(3);
    return [
      { name: 'main', current: true, lastCommit: 'a1b2c3d4', ahead: 0, behind: 0, color: colors[0] },
      { name: 'feature/dashboard', current: false, lastCommit: 'i9j0k1l2', ahead: 3, behind: 2, color: colors[1] },
      { name: 'hotfix/auth', current: false, lastCommit: 'e5f6g7h8', ahead: 1, behind: 0, color: colors[2] }
    ];
  }, [branches]);

  const positionedCommits = useMemo(() => 
    calculateCommitPositions(sampleCommits, sampleBranches), 
    [sampleCommits, sampleBranches]
  );

  const filteredCommits = useMemo(() => {
    if (!searchQuery) return positionedCommits;
    if (selectedBranch) {
      return positionedCommits.filter(c => c.branch === selectedBranch);
    }
    return positionedCommits.filter(c => 
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.files.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [positionedCommits, searchQuery, selectedBranch]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getCommitIcon = (commit: GitCommitData) => {
    if (commit.message.includes('feat:')) return <GitCommit className="w-4 h-4 text-green-500" />;
    if (commit.message.includes('fix:')) return <GitCommit className="w-4 h-4 text-red-500" />;
    if (commit.message.includes('docs:')) return <GitCommit className="w-4 h-4 text-blue-500" />;
    if (commit.message.includes('refactor:')) return <GitCommit className="w-4 h-4 text-purple-500" />;
    return <GitCommit className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            Git History Visualizer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              <Filter className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Search and Filter Bar */}
        <div className="flex items-center gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search commits, authors, or files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Branch Filter */}
          <Select value={selectedBranch || ''} onValueChange={(value) => setSelectedBranch(value || null)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All branches</SelectItem>
              {sampleBranches.map(branch => (
                <SelectItem key={branch.name} value={branch.name}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: branch.color }}
                    />
                    {branch.name}
                    {branch.current && <Badge variant="secondary" className="text-xs">current</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={`relative ${isFullscreen ? 'h-full' : 'h-96'}`}>
          <ScrollArea className="h-full">
            <div className="p-6 min-h-full">
              {/* Branch Headers */}
              <div className="flex items-center justify-between mb-6">
                {sampleBranches.map((branch, index) => (
                  <motion.div
                    key={branch.name}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: animationSpeed }}
                    className="flex flex-col items-center"
                    style={{ marginLeft: index * 120 }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-white shadow-lg" 
                        style={{ backgroundColor: branch.color }}
                      />
                      <span className="text-sm font-medium">{branch.name}</span>
                      {branch.current && (
                        <Badge variant="secondary" className="text-xs">current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {branch.ahead > 0 && <span className="text-green-500">+{branch.ahead}</span>}
                      {branch.behind > 0 && <span className="text-red-500">-{branch.behind}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Commit Timeline */}
              <div className="relative">
                {/* Branch Lines */}
                {sampleBranches.map((branch, branchIndex) => (
                  <div
                    key={branch.name}
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{ 
                      left: branchIndex * 120 + 60,
                      backgroundColor: branch.color,
                      opacity: 0.3
                    }}
                  />
                ))}

                {/* Commits */}
                <AnimatePresence>
                  {filteredCommits.map((commit, index) => (
                    <motion.div
                      key={commit.hash}
                      initial={{ opacity: 0, scale: 0.8, x: -50 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 50 }}
                      transition={{ 
                        delay: index * 0.1, 
                        duration: animationSpeed,
                        type: "spring",
                        stiffness: 100
                      }}
                      className="absolute"
                      style={{ 
                        left: commit.x + 60 - 20, // Center on branch line
                        top: commit.y + 20
                      }}
                    >
                      {/* Commit Bubble */}
                      <motion.div
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group cursor-pointer"
                        onClick={() => onCommitSelect?.(commit)}
                      >
                        {/* Commit Circle */}
                        <div 
                          className="w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                          style={{ backgroundColor: commit.color }}
                        >
                          {getCommitIcon(commit)}
                        </div>

                        {/* Commit Info Popup */}
                        <div className="absolute left-12 top-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-20">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {commit.hash.substring(0, 8)}
                              </Badge>
                              {commit.tags?.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="font-medium text-gray-900">{commit.message}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {commit.author}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(commit.date)}
                              </div>
                            </div>
                            {commit.stats && (
                              <div className="flex items-center gap-4 text-xs">
                                <span className="text-green-600">+{commit.stats.additions}</span>
                                <span className="text-red-600">-{commit.stats.deletions}</span>
                                <span className="text-gray-600">{commit.stats.total} changes</span>
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {commit.files.length} file{commit.files.length !== 1 ? 's' : ''} changed
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Commit Message */}
                      <div className="mt-2 text-center">
                        <p className="text-xs text-gray-600 max-w-32 truncate">
                          {commit.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(commit.date)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
