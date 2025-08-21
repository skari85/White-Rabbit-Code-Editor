'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  GitCommit, 
  User, 
  Calendar, 
  Search, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Rewind,
  FastForward,
  Eye,
  EyeOff,
  Thermometer,
  Ghost,
  History,
  Download,
  Info,
  Lightbulb,
  Flame,
  Snowflake,
  Timer,
  GitBranch,
  FileText,
  Code2,
  Zap
} from 'lucide-react';
import { 
  CodeChronoscopeService, 
  ChronoscopeState, 
  GitCommit as GitCommitType, 
  CodeHeatData 
} from '@/lib/code-chronoscope-service';
import { toast } from 'sonner';

interface CodeChronoscopeProps {
  filePath: string;
  initialContent: string;
  className?: string;
}

export default function CodeChronoscope({
  filePath,
  initialContent,
  className = ''
}: CodeChronoscopeProps) {
  const [chronoscopeState, setChronoscopeState] = useState<ChronoscopeState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000); // ms between commits
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [showGhostLines, setShowGhostLines] = useState(true);
  const [heatIntensity, setHeatIntensity] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommit, setSelectedCommit] = useState<GitCommitType | null>(null);

  const chronoscopeService = CodeChronoscopeService.getInstance();

  // Load initial chronoscope state
  useEffect(() => {
    loadChronoscopeState(0);
  }, [filePath]);

  // Playback effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && chronoscopeState) {
      interval = setInterval(() => {
        const nextIndex = chronoscopeState.currentCommitIndex + 1;
        if (nextIndex < chronoscopeState.fileHistory.commits.length) {
          navigateToCommit(nextIndex);
        } else {
          setIsPlaying(false);
        }
      }, playbackSpeed);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, chronoscopeState, playbackSpeed]);

  const loadChronoscopeState = useCallback(async (commitIndex: number) => {
    setIsLoading(true);
    try {
      const state = await chronoscopeService.createChronoscopeState(filePath, commitIndex);
      setChronoscopeState(state);
      setSelectedCommit(state.fileHistory.commits[commitIndex]);
    } catch (error) {
      console.error('Failed to load chronoscope state:', error);
      toast.error('Failed to load code history');
    } finally {
      setIsLoading(false);
    }
  }, [filePath, chronoscopeService]);

  const navigateToCommit = useCallback(async (commitIndex: number) => {
    if (!chronoscopeState) return;
    
    try {
      const state = await chronoscopeService.navigateToCommit(filePath, commitIndex);
      setChronoscopeState(state);
      setSelectedCommit(state.fileHistory.commits[commitIndex]);
    } catch (error) {
      console.error('Failed to navigate to commit:', error);
      toast.error('Failed to navigate to commit');
    }
  }, [chronoscopeState, filePath, chronoscopeService]);

  const handleSliderChange = useCallback((value: number[]) => {
    if (chronoscopeState && value[0] !== chronoscopeState.currentCommitIndex) {
      navigateToCommit(value[0]);
    }
  }, [chronoscopeState, navigateToCommit]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleStepForward = useCallback(() => {
    if (chronoscopeState) {
      const nextIndex = Math.min(
        chronoscopeState.currentCommitIndex + 1,
        chronoscopeState.fileHistory.commits.length - 1
      );
      navigateToCommit(nextIndex);
    }
  }, [chronoscopeState, navigateToCommit]);

  const handleStepBackward = useCallback(() => {
    if (chronoscopeState) {
      const prevIndex = Math.max(chronoscopeState.currentCommitIndex - 1, 0);
      navigateToCommit(prevIndex);
    }
  }, [chronoscopeState, navigateToCommit]);

  const handleSkipToStart = useCallback(() => {
    if (chronoscopeState) {
      navigateToCommit(0);
    }
  }, [chronoscopeState, navigateToCommit]);

  const handleSkipToEnd = useCallback(() => {
    if (chronoscopeState) {
      navigateToCommit(chronoscopeState.fileHistory.commits.length - 1);
    }
  }, [chronoscopeState, navigateToCommit]);

  const getHeatMapStyle = useCallback((lineNumber: number): React.CSSProperties => {
    if (!chronoscopeState || !showHeatMap) return {};
    
    const heat = chronoscopeState.heatMap.get(lineNumber) || 0;
    const adjustedHeat = (heat * heatIntensity) / 100;
    
    if (adjustedHeat < 10) return {};
    
    const opacity = Math.min(adjustedHeat / 100, 0.4);
    const hue = heat > 70 ? 0 : heat > 40 ? 30 : 60; // Red -> Orange -> Yellow
    
    return {
      backgroundColor: `hsla(${hue}, 80%, 60%, ${opacity})`,
      borderLeft: heat > 50 ? `2px solid hsla(${hue}, 80%, 50%, 0.8)` : undefined,
      transition: 'all 0.3s ease'
    };
  }, [chronoscopeState, showHeatMap, heatIntensity]);

  const getGhostLineStyle = useCallback((lineNumber: number): React.CSSProperties => {
    if (!chronoscopeState || !showGhostLines) return {};
    
    const ghostLine = chronoscopeState.ghostLines.get(lineNumber);
    if (!ghostLine) return {};
    
    return {
      opacity: ghostLine.type === 'removed' ? 0.3 : 1,
      backgroundColor: ghostLine.type === 'added' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
      textDecoration: ghostLine.type === 'removed' ? 'line-through' : undefined,
      borderLeft: ghostLine.type === 'added' ? '3px solid #22c55e' : '3px solid #ef4444',
      animation: ghostLine.type === 'added' ? 'ink-bleed 0.5s ease-out' : undefined,
      transition: 'all 0.5s ease'
    };
  }, [chronoscopeState, showGhostLines]);

  const filteredCommits = useMemo(() => {
    if (!chronoscopeState || !searchQuery) return chronoscopeState?.fileHistory.commits || [];
    
    return chronoscopeService.searchCommits(chronoscopeState.fileHistory, searchQuery);
  }, [chronoscopeState, searchQuery, chronoscopeService]);

  const heatData = useMemo(() => {
    if (!chronoscopeState) return [];
    return chronoscopeService.getHeatData(chronoscopeState);
  }, [chronoscopeState, chronoscopeService]);

  const currentCommit = selectedCommit || chronoscopeState?.fileHistory.commits[0];

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <Clock className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600">Loading code chronoscope...</p>
        </div>
      </div>
    );
  }

  if (!chronoscopeState) {
    return (
      <div className={`p-4 ${className}`}>
        <Card>
          <CardContent className="text-center py-8">
            <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium">No history available</p>
            <p className="text-xs text-gray-400 mt-1">
              Initialize a git repository to use the Code Chronoscope
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Timeline Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-blue-500" />
            Code Chronoscope
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {chronoscopeState.fileHistory.totalCommits} commits
              </Badge>
              <Badge variant="outline">
                {new Date(currentCommit?.date || Date.now()).toLocaleDateString()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHeatMap(!showHeatMap)}
              >
                <Thermometer className="w-4 h-4 mr-1" />
                Heat Map
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGhostLines(!showGhostLines)}
              >
                <Ghost className="w-4 h-4 mr-1" />
                Ghost Lines
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Playback Controls */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipToStart}
              disabled={chronoscopeState.currentCommitIndex === 0}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStepBackward}
              disabled={chronoscopeState.currentCommitIndex === 0}
            >
              <Rewind className="w-4 h-4" />
            </Button>
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="sm"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStepForward}
              disabled={chronoscopeState.currentCommitIndex === chronoscopeState.fileHistory.commits.length - 1}
            >
              <FastForward className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipToEnd}
              disabled={chronoscopeState.currentCommitIndex === chronoscopeState.fileHistory.commits.length - 1}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-500" />
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1"
              >
                <option value={500}>2x Speed</option>
                <option value={1000}>1x Speed</option>
                <option value={2000}>0.5x Speed</option>
                <option value={3000}>0.3x Speed</option>
              </select>
            </div>
          </div>

          {/* Timeline Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Commit {chronoscopeState.currentCommitIndex + 1} of {chronoscopeState.fileHistory.totalCommits}</span>
              <span>{currentCommit?.shortHash}</span>
            </div>
            <Slider
              value={[chronoscopeState.currentCommitIndex]}
              onValueChange={handleSliderChange}
              max={chronoscopeState.fileHistory.totalCommits - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>First</span>
              <span>Latest</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Display with Heat Map and Ghost Lines */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {filePath} • {currentCommit?.message}
            </CardTitle>
            <div className="flex items-center gap-2">
              {showHeatMap && (
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs">Heat: {heatIntensity}%</span>
                  <Slider
                    value={[heatIntensity]}
                    onValueChange={(value) => setHeatIntensity(value[0])}
                    max={100}
                    step={10}
                    className="w-16"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {currentCommit?.author}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {currentCommit?.date.toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <GitCommit className="w-3 h-3" />
              {currentCommit?.shortHash}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96 relative">
            {chronoscopeState.currentContent.split('\n').map((line, index) => {
              const lineNumber = index + 1;
              const heatStyle = getHeatMapStyle(lineNumber);
              const ghostStyle = getGhostLineStyle(lineNumber);
              
              return (
                <div
                  key={lineNumber}
                  className="flex items-center hover:bg-gray-800 transition-colors"
                  style={{ ...heatStyle, ...ghostStyle }}
                >
                  <span className="text-gray-500 text-xs w-8 text-right mr-3 select-none">
                    {lineNumber}
                  </span>
                  <span className="flex-1">{line || ' '}</span>
                  {showHeatMap && heatStyle.backgroundColor && (
                    <div className="ml-2 flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-orange-400">
                        {chronoscopeState.heatMap.get(lineNumber) || 0}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-6 text-xs text-gray-600">
            {showHeatMap && (
              <div className="flex items-center gap-2">
                <Flame className="w-3 h-3 text-red-500" />
                <span>Hot (recent changes)</span>
                <Snowflake className="w-3 h-3 text-blue-500" />
                <span>Cold (stable)</span>
              </div>
            )}
            {showGhostLines && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 bg-green-500"></div>
                  <span>Added lines</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-1 bg-red-500"></div>
                  <span>Removed lines</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commit History & Analysis */}
      <Card>
        <CardContent>
          <Tabs defaultValue="commits" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="commits">Commit History</TabsTrigger>
              <TabsTrigger value="heatmap">Heat Analysis</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="commits" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search commits by author, message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>

                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {filteredCommits.map((commit, index) => (
                      <div
                        key={commit.hash}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCommit?.hash === commit.hash
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => navigateToCommit(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GitCommit className="w-4 h-4 text-blue-500" />
                            <span className="font-mono text-sm">{commit.shortHash}</span>
                            <Badge variant="outline" className="text-xs">
                              {commit.author}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-500">
                            {commit.date.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{commit.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="heatmap" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium">Line Heat Analysis</h4>
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {heatData.map((data) => (
                      <div
                        key={data.lineNumber}
                        className="flex items-center justify-between p-2 text-sm border rounded"
                        style={{
                          backgroundColor: `hsla(${data.heatIntensity > 70 ? 0 : data.heatIntensity > 40 ? 30 : 60}, 60%, 95%, ${data.heatIntensity / 200})`
                        }}
                      >
                        <span>Line {data.lineNumber}</span>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{data.commitCount} commits</span>
                          <span>{data.authorCount} authors</span>
                          <span>Heat: {data.heatIntensity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <GitBranch className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{chronoscopeState.fileHistory.totalCommits}</div>
                  <div className="text-xs text-gray-600">Total Commits</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <User className="w-6 h-6 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">
                    {new Set(chronoscopeState.fileHistory.commits.map(c => c.author)).size}
                  </div>
                  <div className="text-xs text-gray-600">Contributors</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">
                    {Math.round(Array.from(chronoscopeState.heatMap.values()).reduce((a, b) => a + b, 0) / chronoscopeState.heatMap.size)}
                  </div>
                  <div className="text-xs text-gray-600">Avg Heat</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">
                    {chronoscopeState.currentContent.split('\n').length}
                  </div>
                  <div className="text-xs text-gray-600">Lines of Code</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
