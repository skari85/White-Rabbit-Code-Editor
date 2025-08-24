'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  GitBranch, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Settings,
  Zap,
  Activity,
  Target,
  Code,
  Database,
  Network,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FunctionNode {
  id: string;
  name: string;
  type: 'function' | 'class' | 'module' | 'api' | 'database';
  position: { x: number; y: number };
  size: { width: number; height: number };
  complexity: number;
  dependencies: string[];
  calls: string[];
  dataFlow: DataFlow[];
  metadata: {
    lines: number;
    parameters: number;
    returnType: string;
    executionTime?: number;
    memoryUsage?: number;
  };
}

interface DataFlow {
  id: string;
  from: string;
  to: string;
  type: 'data' | 'control' | 'async' | 'error';
  data: string[];
  direction: 'forward' | 'backward' | 'bidirectional';
}

interface CodeFlowVisualizerProps {
  code?: string;
  functions?: FunctionNode[];
  onNodeSelect?: (node: FunctionNode) => void;
  className?: string;
}

// Generate sample function data for demonstration
const generateSampleFunctions = (): FunctionNode[] => {
  return [
    {
      id: 'main',
      name: 'main()',
      type: 'function',
      position: { x: 400, y: 50 },
      size: { width: 120, height: 80 },
      complexity: 3,
      dependencies: ['auth', 'router'],
      calls: ['auth.initialize', 'router.start'],
      dataFlow: [
        {
          id: 'flow1',
          from: 'main',
          to: 'auth.initialize',
          type: 'control',
          data: ['config'],
          direction: 'forward'
        },
        {
          id: 'flow2',
          from: 'main',
          to: 'router.start',
          type: 'control',
          data: ['port'],
          direction: 'forward'
        }
      ],
      metadata: {
        lines: 15,
        parameters: 0,
        returnType: 'void'
      }
    },
    {
      id: 'auth.initialize',
      name: 'auth.initialize()',
      type: 'function',
      position: { x: 200, y: 200 },
      size: { width: 140, height: 80 },
      complexity: 5,
      dependencies: ['jwt', 'database'],
      calls: ['jwt.setup', 'database.connect'],
      dataFlow: [
        {
          id: 'flow3',
          from: 'auth.initialize',
          to: 'jwt.setup',
          type: 'data',
          data: ['secret', 'expiry'],
          direction: 'forward'
        },
        {
          id: 'flow4',
          from: 'auth.initialize',
          to: 'database.connect',
          type: 'data',
          data: ['connectionString'],
          direction: 'forward'
        }
      ],
      metadata: {
        lines: 25,
        parameters: 1,
        returnType: 'Promise<boolean>'
      }
    },
    {
      id: 'jwt.setup',
      name: 'jwt.setup()',
      type: 'function',
      position: { x: 50, y: 350 },
      size: { width: 100, height: 60 },
      complexity: 2,
      dependencies: [],
      calls: [],
      dataFlow: [],
      metadata: {
        lines: 8,
        parameters: 2,
        returnType: 'void'
      }
    },
    {
      id: 'database.connect',
      name: 'database.connect()',
      type: 'function',
      position: { x: 300, y: 350 },
      size: { width: 120, height: 60 },
      complexity: 4,
      dependencies: ['connectionPool'],
      calls: ['connectionPool.create'],
      dataFlow: [
        {
          id: 'flow5',
          from: 'database.connect',
          to: 'connectionPool.create',
          type: 'data',
          data: ['maxConnections'],
          direction: 'forward'
        }
      ],
      metadata: {
        lines: 18,
        parameters: 1,
        returnType: 'Promise<Connection>'
      }
    },
    {
      id: 'router.start',
      name: 'router.start()',
      type: 'function',
      position: { x: 600, y: 200 },
      size: { width: 120, height: 80 },
      complexity: 6,
      dependencies: ['middleware', 'routes'],
      calls: ['middleware.setup', 'routes.register'],
      dataFlow: [
        {
          id: 'flow6',
          from: 'router.start',
          to: 'middleware.setup',
          type: 'control',
          data: ['cors', 'helmet'],
          direction: 'forward'
        },
        {
          id: 'flow7',
          from: 'router.start',
          to: 'routes.register',
          type: 'control',
          data: ['apiRoutes'],
          direction: 'forward'
        }
      ],
      metadata: {
        lines: 22,
        parameters: 1,
        returnType: 'Promise<void>'
      }
    },
    {
      id: 'middleware.setup',
      name: 'middleware.setup()',
      type: 'function',
      position: { x: 500, y: 350 },
      size: { width: 140, height: 60 },
      complexity: 3,
      dependencies: ['cors', 'helmet'],
      calls: ['cors.enable', 'helmet.configure'],
      dataFlow: [
        {
          id: 'flow8',
          from: 'middleware.setup',
          to: 'cors.enable',
          type: 'control',
          data: ['origin'],
          direction: 'forward'
        }
      ],
      metadata: {
        lines: 12,
        parameters: 2,
        returnType: 'void'
      }
    },
    {
      id: 'routes.register',
      name: 'routes.register()',
      type: 'function',
      position: { x: 750, y: 350 },
      size: { width: 120, height: 60 },
      complexity: 4,
      dependencies: ['apiRoutes'],
      calls: ['apiRoutes.mount'],
      dataFlow: [
        {
          id: 'flow9',
          from: 'routes.register',
          to: 'apiRoutes.mount',
          type: 'control',
          data: ['basePath'],
          direction: 'forward'
        }
      ],
      metadata: {
        lines: 16,
        parameters: 1,
        returnType: 'void'
      }
    }
  ];
};

// Get node color based on type and complexity
const getNodeColor = (node: FunctionNode): string => {
  const baseColors = {
    function: '#3B82F6',
    class: '#10B981',
    module: '#8B5CF6',
    api: '#F59E0B',
    database: '#EF4444'
  };
  
  const baseColor = baseColors[node.type] || '#6B7280';
  
  // Adjust brightness based on complexity
  if (node.complexity > 7) return '#EF4444'; // Red for high complexity
  if (node.complexity > 5) return '#F59E0B'; // Yellow for medium complexity
  
  return baseColor;
};

// Get flow color based on type
const getFlowColor = (flow: DataFlow): string => {
  switch (flow.type) {
    case 'data': return '#10B981';
    case 'control': return '#3B82F6';
    case 'async': return '#F59E0B';
    case 'error': return '#EF4444';
    default: return '#6B7280';
  }
};

export default function CodeFlowVisualizer({ 
  code, 
  functions = [], 
  onNodeSelect,
  className = ''
}: CodeFlowVisualizerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showDataFlow, setShowDataFlow] = useState(true);
  const [showComplexity, setShowComplexity] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Use sample data if none provided
  const displayFunctions = useMemo(() => {
    if (functions.length > 0) return functions;
    return generateSampleFunctions();
  }, [functions]);

  const filteredFunctions = useMemo(() => {
    if (!searchQuery) return displayFunctions;
    return displayFunctions.filter(func => 
      func.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      func.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [displayFunctions, searchQuery]);

  const toggleAnimation = () => setIsAnimating(!isAnimating);
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleNodeClick = (node: FunctionNode) => {
    setSelectedNode(selectedNode === node.id ? null : node.id);
    onNodeSelect?.(node);
  };

  const getNodeSize = (node: FunctionNode) => {
    const baseSize = 80;
    const complexityMultiplier = Math.min(node.complexity / 5, 2);
    return {
      width: baseSize + (complexityMultiplier * 20),
      height: baseSize + (complexityMultiplier * 20)
    };
  };

  const renderNode = (node: FunctionNode) => {
    const isSelected = selectedNode === node.id;
    const nodeSize = getNodeSize(node);
    const color = getNodeColor(node);
    const hasHighComplexity = node.complexity > 7;

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: isSelected ? 1.1 : 1,
          boxShadow: isSelected ? `0 0 20px ${color}` : '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 300
        }}
        whileHover={{ scale: 1.05 }}
        className="absolute cursor-pointer"
        style={{
          left: node.position.x - nodeSize.width / 2,
          top: node.position.y - nodeSize.height / 2,
          width: nodeSize.width,
          height: nodeSize.height
        }}
        onClick={() => handleNodeClick(node)}
      >
        {/* Node background */}
        <div
          className="w-full h-full rounded-lg border-2 border-white shadow-lg flex flex-col items-center justify-center text-white relative overflow-hidden"
          style={{ backgroundColor: color }}
        >
          {/* Complexity indicator */}
          {showComplexity && node.complexity > 5 && (
            <div className="absolute top-1 right-1">
              <Badge 
                variant="secondary" 
                className={`text-xs ${hasHighComplexity ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}
              >
                <Zap className="w-3 h-3 mr-1" />
                {node.complexity}
              </Badge>
            </div>
          )}

          {/* Node icon */}
          <div className="text-2xl mb-1">
            {node.type === 'function' && <Code className="w-6 h-6" />}
            {node.type === 'class' && <Cpu className="w-6 h-6" />}
            {node.type === 'module' && <GitBranch className="w-6 h-6" />}
            {node.type === 'api' && <Network className="w-6 h-6" />}
            {node.type === 'database' && <Database className="w-6 h-6" />}
          </div>

          {/* Node name */}
          <div className="text-xs font-medium text-center px-1 leading-tight">
            {node.name}
          </div>

          {/* Node type */}
          <div className="text-xs opacity-75 mt-1">
            {node.type}
          </div>

          {/* Activity pulse for high complexity */}
          {hasHighComplexity && isAnimating && (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-lg border-2 border-red-400 pointer-events-none"
            />
          )}
        </div>

        {/* Node details popup */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-20"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{node.name}</span>
                <Badge variant="outline" className="text-xs">
                  {node.type}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <div>Complexity: {node.complexity}/10</div>
                <div>Lines: {node.metadata.lines}</div>
                <div>Parameters: {node.metadata.parameters}</div>
                <div>Returns: {node.metadata.returnType}</div>
              </div>

              {node.dependencies.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-1">Dependencies:</div>
                  <div className="flex flex-wrap gap-1">
                    {node.dependencies.map(dep => (
                      <Badge key={dep} variant="outline" className="text-xs">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderDataFlow = (flow: DataFlow) => {
    const fromNode = displayFunctions.find(f => f.id === flow.from);
    const toNode = displayFunctions.find(f => f.id === flow.to);
    
    if (!fromNode || !toNode) return null;

    const fromPos = fromNode.position;
    const toPos = toNode.position;
    const color = getFlowColor(flow);
    
    // Calculate arrow position and angle
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Adjust start and end points to node boundaries
    const fromNodeSize = getNodeSize(fromNode);
    const toNodeSize = getNodeSize(toNode);
    const startX = fromPos.x + (fromNodeSize.width / 2) * Math.cos(angle);
    const startY = fromPos.y + (fromNodeSize.height / 2) * Math.sin(angle);
    const endX = toPos.x - (toNodeSize.width / 2) * Math.cos(angle);
    const endY = toPos.y - (toNodeSize.height / 2) * Math.sin(angle);

    return (
      <motion.g key={flow.id}>
        {/* Flow line */}
        <motion.line
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ 
            duration: 2 / animationSpeed,
            delay: 0.5,
            ease: "easeInOut"
          }}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity={0.7}
        />

        {/* Arrow head */}
        <motion.polygon
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 / animationSpeed }}
          points={`${endX - 8 * Math.cos(angle - Math.PI / 6)},${endY - 8 * Math.sin(angle - Math.PI / 6)} ${endX},${endY} ${endX - 8 * Math.cos(angle + Math.PI / 6)},${endY - 8 * Math.sin(angle + Math.PI / 6)}`}
          fill={color}
        />

        {/* Data flow particles */}
        {showDataFlow && isAnimating && (
          <motion.circle
            initial={{ 
              cx: startX, 
              cy: startY, 
              r: 3,
              opacity: 1 
            }}
            animate={{ 
              cx: endX, 
              cy: endY, 
              opacity: 0 
            }}
            transition={{ 
              duration: 3 / animationSpeed,
              repeat: Infinity,
              ease: "linear"
            }}
            fill={color}
          />
        )}
      </motion.g>
    );
  };

  return (
    <Card className={`${className} ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            Code Flow Visualizer
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAnimation}
            >
              {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDataFlow(!showDataFlow)}
            >
              <Activity className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComplexity(!showComplexity)}
            >
              <Target className="w-4 h-4" />
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

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3">
          <div className="relative flex-1">
            <Input
              placeholder="Search functions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">Speed:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className={`relative ${isFullscreen ? 'h-full' : 'h-96'}`}>
          <ScrollArea className="h-full">
            <div 
              ref={containerRef}
              className="relative w-full h-full min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
            >
              {/* SVG overlay for connections */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ zIndex: 1 }}
              >
                {showDataFlow && filteredFunctions.map(func => 
                  func.dataFlow.map(flow => renderDataFlow(flow))
                )}
              </svg>

              {/* Function nodes */}
              <div style={{ zIndex: 2, position: 'relative' }}>
                {filteredFunctions.map(func => renderNode(func))}
              </div>

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
                <div className="text-xs font-medium mb-2">Legend</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Control Flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span>Data Flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-500"></div>
                    <span>Async Flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Error Flow</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
