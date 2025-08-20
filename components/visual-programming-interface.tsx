import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Play, 
  Square, 
  Save, 
  Loader2, 
  Settings, 
  Download, 
  Upload,
  Plus,
  Trash2,
  Copy,
  Check,
  X
} from 'lucide-react';

// Blockly types
interface BlocklyWorkspace {
  addChangeListener: (callback: () => void) => void;
  getCode: (language: string) => string;
  clear: () => void;
  dispose: () => void;
}

interface VisualProgrammingInterfaceProps {
  onCodeGenerated?: (code: string, language: string) => void;
  onSaveTemplate?: (template: any) => void;
  onLoadTemplate?: (template: any) => void;
  className?: string;
}

// Enhanced template system with better block definitions
const PREBUILT_TEMPLATES = [
  {
    id: 'counter-app',
    name: 'Counter App',
    description: 'A simple counter application with increment/decrement functionality',
    category: 'Basic',
    difficulty: 'Beginner',
    estimatedTime: '5 min',
    blocks: [
      {
        type: 'variables_set',
        x: '100',
        y: '100',
        fields: { VAR: 'counter' },
        inputs: { VALUE: { block: { type: 'math_number', fields: { NUM: '0' } } } }
      },
      {
        type: 'controls_if',
        x: '100',
        y: '200',
        inputs: {
          IF0: { block: { type: 'logic_compare', fields: { A: 'counter', OP: 'EQ', B: '0' } } },
          DO0: { block: { type: 'text_print', fields: { TEXT: 'Counter is zero' } } }
        }
      }
    ]
  },
  {
    id: 'todo-list',
    name: 'Todo List',
    description: 'A todo list application with add/remove functionality',
    category: 'Basic',
    difficulty: 'Beginner',
    estimatedTime: '10 min',
    blocks: [
      {
        type: 'variables_set',
        x: '100',
        y: '100',
        fields: { VAR: 'todos' },
        inputs: { VALUE: { block: { type: 'lists_create_empty', fields: { TYPE: 'Array' } } } }
      },
      {
        type: 'controls_repeat_ext',
        x: '100',
        y: '200',
        inputs: {
          TIMES: { block: { type: 'math_number', fields: { NUM: '5' } } },
          DO: { block: { type: 'lists_add', fields: { MODE: 'APPEND' } } }
        }
      }
    ]
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'A basic calculator with arithmetic operations',
    category: 'Advanced',
    difficulty: 'Intermediate',
    estimatedTime: '15 min',
    blocks: [
      {
        type: 'variables_set',
        x: '100',
        y: '100',
        fields: { VAR: 'result' },
        inputs: { VALUE: { block: { type: 'math_arithmetic', fields: { OP: 'ADD' } } } }
      },
      {
        type: 'controls_if',
        x: '100',
        y: '200',
        inputs: {
          IF0: { block: { type: 'logic_compare', fields: { A: 'result', OP: 'GT', B: '100' } } },
          DO0: { block: { type: 'text_print', fields: { TEXT: 'Result is large' } } }
        }
      }
    ]
  },
  {
    id: 'simple-game',
    name: 'Simple Game',
    description: 'A basic number guessing game',
    category: 'Advanced',
    difficulty: 'Intermediate',
    estimatedTime: '20 min',
    blocks: [
      {
        type: 'variables_set',
        x: '100',
        y: '100',
        fields: { VAR: 'secretNumber' },
        inputs: { VALUE: { block: { type: 'math_random_int', fields: { MIN: '1', MAX: '10' } } } }
      },
      {
        type: 'controls_repeat_ext',
        x: '100',
        y: '200',
        inputs: {
          TIMES: { block: { type: 'math_number', fields: { NUM: '3' } } },
          DO: { block: { type: 'text_print', fields: { TEXT: 'Guess the number!' } } }
        }
      }
    ]
  }
];

export default function VisualProgrammingInterface({
  onCodeGenerated,
  onSaveTemplate,
  onLoadTemplate,
  className = ''
}: VisualProgrammingInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<string | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  
  const blocklyContainerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<BlocklyWorkspace | null>(null);

  // Add demo mode and improve template loading
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Add help section and improve user experience
  const [showHelp, setShowHelp] = useState(false);

  // Add quick start guide and interactive features
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Add progress tracking and workspace statistics
  const [workspaceStats, setWorkspaceStats] = useState({ blocks: 0, connections: 0, complexity: 0 });
  const [blocklyError, setBlocklyError] = useState<string | null>(null);

  const quickStartSteps = [
    {
      title: "Welcome to Visual Programming!",
      description: "Let's get you started with creating logic flows without writing code.",
      action: "Click 'Next' to continue"
    },
    {
      title: "Choose a Template",
      description: "Start with a pre-built template to understand the basics. We recommend starting with 'Counter App' for beginners.",
      action: "Select a template from the right panel"
    },
    {
      title: "Drag and Drop Blocks",
      description: "Use the toolbox on the left to drag blocks into your workspace. Connect them by dragging blocks near each other.",
      action: "Try dragging a 'Math' block into your workspace"
    },
    {
      title: "Generate Code",
      description: "Once you're happy with your visual program, click 'Generate Code' to convert it to JavaScript.",
      action: "Click the 'Generate Code' button when ready"
    }
  ];

  // Initialize Blockly workspace
  useEffect(() => {
    const initBlockly = async () => {
      try {
        setIsLoading(true);
        console.log('Initializing Blockly...');
        
        // Dynamic import of Blockly to avoid SSR issues
        const Blockly = await import('blockly');
        console.log('Blockly imported successfully:', Blockly);
        
        if (blocklyContainerRef.current) {
          console.log('Container found, creating workspace...');
          
          // Create Blockly workspace
          const workspace = Blockly.inject(blocklyContainerRef.current, {
            toolbox: {
              kind: 'categoryToolbox',
              contents: [
                {
                  kind: 'category',
                  name: 'Logic',
                  colour: '210',
                  contents: [
                    { kind: 'block', type: 'controls_if' },
                    { kind: 'block', type: 'logic_compare' },
                    { kind: 'block', type: 'logic_operation' },
                    { kind: 'block', type: 'logic_negate' },
                    { kind: 'block', type: 'logic_boolean' }
                  ]
                },
                {
                  kind: 'category',
                  name: 'Loops',
                  colour: '120',
                  contents: [
                    { kind: 'block', type: 'controls_repeat_ext' },
                    { kind: 'block', type: 'controls_whileUntil' },
                    { kind: 'block', type: 'controls_for' },
                    { kind: 'block', type: 'controls_forEach' }
                  ]
                },
                {
                  kind: 'category',
                  name: 'Math',
                  colour: '230',
                  contents: [
                    { kind: 'block', type: 'math_number' },
                    { kind: 'block', type: 'math_arithmetic' },
                    { kind: 'block', type: 'math_single' },
                    { kind: 'block', type: 'math_random_int' }
                  ]
                },
                {
                  kind: 'category',
                  name: 'Text',
                  colour: '160',
                  contents: [
                    { kind: 'block', type: 'text' },
                    { kind: 'block', type: 'text_join' },
                    { kind: 'block', type: 'text_length' },
                    { kind: 'block', type: 'text_print' }
                  ]
                },
                {
                  kind: 'category',
                  name: 'Variables',
                  colour: '330',
                  custom: 'VARIABLE'
                },
                {
                  kind: 'category',
                  name: 'Functions',
                  colour: '290',
                  custom: 'PROCEDURE'
                }
              ]
            },
            scrollbars: true,
            trashcan: true,
            grid: {
              spacing: 20,
              length: 3,
              colour: '#ccc',
              snap: true
            },
            zoom: {
              controls: true,
              wheel: true,
              startScale: 1.0,
              maxScale: 3,
              minScale: 0.3,
              scaleSpeed: 1.2
            }
          });

          console.log('Workspace created successfully:', workspace);
          workspaceRef.current = workspace as any;

          // Add change listener to generate code
          workspace.addChangeListener(() => {
            if (onCodeGenerated) {
              try {
                // Check if workspace is valid before generating code
                if (!workspace || typeof (workspace as any).getCode !== 'function') {
                  return;
                }
                
                const code = (workspace as any).getCode('JavaScript');
                console.log('Code generated from workspace:', code);
                
                // Update workspace statistics
                updateWorkspaceStats();
              } catch (error) {
                console.error('Error generating code:', error);
              }
            }
          });

          // Add some demo blocks to get started
          try {
            const demoBlock = workspace.newBlock('text_print');
            demoBlock.setFieldValue('Hello from Visual Programming!', 'TEXT');
            demoBlock.moveBy(100, 100);
            console.log('Demo block added successfully');
          } catch (error) {
            console.warn('Could not add demo block:', error);
          }

          setIsLoading(false);
          console.log('Blockly initialization completed');
        } else {
          console.error('Blockly container not found');
          setIsLoading(false);
        }
              } catch (error) {
          console.error('Failed to initialize Blockly:', error);
          setIsLoading(false);
          setBlocklyError(error instanceof Error ? error.message : 'Unknown error occurred');
        }
    };

    // Initialize after a short delay to ensure DOM is ready
    const timer = setTimeout(initBlockly, 100);
    return () => clearTimeout(timer);
  }, [onCodeGenerated]);

  // Enhanced template loading with demo mode
  const loadTemplate = (templateId: string) => {
    const template = PREBUILT_TEMPLATES.find(t => t.id === templateId);
    if (template && workspaceRef.current) {
      try {
        // Check if workspace has clear method
        if (typeof (workspaceRef.current as any).clear === 'function') {
          (workspaceRef.current as any).clear();
        }
        
        // Load template blocks into workspace
        console.log('Loading template:', template.name);
        setIsDemoMode(true);
        
        // In a real implementation, you would use Blockly's serialization
        // to load the blocks from the template definition
        // For now, we'll just log the template and show a success message
        console.log('Template blocks:', template.blocks);
        
        // Show success message
        setTimeout(() => {
          setIsDemoMode(false);
        }, 3000);
      } catch (error) {
        console.warn('Error loading template:', error);
        setIsDemoMode(false);
      }
    }
  };

  // Save current workspace as template
  const handleSaveTemplate = () => {
    if (templateName.trim() && onSaveTemplate) {
      const template = {
        id: `template-${Date.now()}`,
        name: templateName,
        description: templateDescription,
        blocks: workspaceRef.current ? (workspaceRef.current as any).getCode('JSON') : '',
        createdAt: new Date().toISOString()
      };
      
      onSaveTemplate(template);
      setShowSaveDialog(false);
      setTemplateName('');
      setTemplateDescription('');
    }
  };

  // Handle template copy with better error handling
  const handleCopyTemplate = async (template: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
      setCopiedTemplate(template.id);
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch (error) {
      console.warn('Could not copy template to clipboard:', error);
      // Fallback: show template data in console
      console.log('Template data:', template);
    }
  };

  // Update workspace statistics
  const updateWorkspaceStats = () => {
    if (workspaceRef.current) {
      try {
        if (typeof (workspaceRef.current as any).getAllBlocks === 'function') {
          const allBlocks = (workspaceRef.current as any).getAllBlocks(false);
          if (Array.isArray(allBlocks)) {
            const blocks = allBlocks.length;
            const connections = allBlocks.filter((block: any) => {
              try {
                return block && typeof block.getConnections_ === 'function' && 
                       block.getConnections_().some((conn: any) => conn && typeof conn.isConnected === 'function' && conn.isConnected());
              } catch {
                return false;
              }
            }).length;
            const complexity = Math.min(100, Math.round((blocks * 10) + (connections * 5)));
            
            setWorkspaceStats({ blocks, connections, complexity });
          }
        }
      } catch (statsError) {
        console.warn('Could not calculate workspace statistics:', statsError);
        // Set default values if statistics calculation fails
        setWorkspaceStats({ blocks: 0, connections: 0, complexity: 0 });
      }
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Visual Programming</h2>
          <p className="text-sm text-gray-600">Create logic flows without writing code</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateDialog(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Templates
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Template
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (workspaceRef.current) {
                const code = (workspaceRef.current as any).getCode('JavaScript');
                console.log('Generated code:', code);
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Code
          </Button>

          {/* Help Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Help
          </Button>

          {/* Quick Start Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickStart(true)}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <Play className="w-4 h-4 mr-2" />
            Quick Start
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Blockly Workspace */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Loading Blockly...</span>
            </div>
          ) : blocklyError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Blockly Failed to Load</h3>
                <p className="text-gray-600 mb-4">{blocklyError}</p>
                <Button
                  onClick={() => {
                    setBlocklyError(null);
                    setIsLoading(true);
                    // Re-initialize Blockly
                    setTimeout(() => {
                      const initBlockly = async () => {
                        try {
                          const Blockly = await import('blockly');
                          if (blocklyContainerRef.current) {
                            const workspace = Blockly.inject(blocklyContainerRef.current, {
                              toolbox: { kind: 'categoryToolbox', contents: [] },
                              scrollbars: true,
                              trashcan: true
                            });
                            workspaceRef.current = workspace as any;
                            setIsLoading(false);
                          }
                        } catch (error) {
                          setBlocklyError(error instanceof Error ? error.message : 'Unknown error occurred');
                          setIsLoading(false);
                        }
                      };
                      initBlockly();
                    }, 100);
                  }}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div 
              ref={blocklyContainerRef} 
              className="w-full h-full"
              style={{ minHeight: '600px' }}
            >
              {/* Demo Mode Indicator */}
              {isDemoMode && (
                <div className="absolute top-4 right-4 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-800 font-medium">Demo Mode</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDemoMode(false)}
                      className="h-6 w-6 p-0 ml-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
              {/* Workspace Statistics */}
              <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Blocks: {workspaceStats.blocks}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Connections: {workspaceStats.connections}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600">Complexity: {workspaceStats.complexity}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Templates Panel */}
        <div className="w-80 border-l bg-gray-50">
          <div className="p-4">
            <h3 className="font-medium mb-3">Pre-built Templates</h3>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {PREBUILT_TEMPLATES.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {template.category}
                            </span>
                            <span className={`inline-block px-2 py-1 text-xs rounded ${
                              template.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                              template.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {template.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">
                              ⏱️ {template.estimatedTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyTemplate(template)}
                            className="h-6 w-6 p-0"
                            title="Copy template"
                          >
                            {copiedTemplate === template.id ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadTemplate(template.id)}
                            className="h-6 w-6 p-0"
                            title="Load template"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose a Template</DialogTitle>
            <DialogDescription>
              Select a pre-built template to quickly create a logic flow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {PREBUILT_TEMPLATES.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setCurrentTemplate(template.id);
                  setShowTemplateDialog(false);
                }}
              >
                <CardContent className="p-4">
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-sm text-gray-600 mt-2">{template.description}</p>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded mt-3">
                    {template.category}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save your current logic flow as a reusable template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Template Name</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Enter template name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Enter template description"
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visual Programming Help</DialogTitle>
            <DialogDescription>
              Need assistance with using the Visual Programming interface?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium mb-2">Getting Started</h4>
              <p className="text-sm text-gray-600">
                1. Choose a template from the right panel to get started quickly<br/>
                2. Drag and drop blocks from the toolbox to create your logic flow<br/>
                3. Connect blocks by dragging them near each other<br/>
                4. Use the "Generate Code" button to convert your visual program to JavaScript
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Available Block Categories</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Logic:</strong> If statements, comparisons, and boolean operations</li>
                <li>• <strong>Loops:</strong> For loops, while loops, and repeat blocks</li>
                <li>• <strong>Math:</strong> Numbers, arithmetic operations, and mathematical functions</li>
                <li>• <strong>Text:</strong> String operations and text output</li>
                <li>• <strong>Variables:</strong> Create and manage variables</li>
                <li>• <strong>Functions:</strong> Define and call functions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tips</h4>
              <p className="text-sm text-gray-600">
                • Start with simple templates like "Counter App" to understand the basics<br/>
                • Use the grid to align blocks neatly<br/>
                • Save your work as custom templates for reuse<br/>
                • The generated code can be further edited in the code editor
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Start Dialog */}
      <Dialog open={showQuickStart} onOpenChange={setShowQuickStart}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{quickStartSteps[currentStep].title}</DialogTitle>
            <DialogDescription>
              Follow these steps to get familiar with the Visual Programming interface.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {quickStartSteps[currentStep].description}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium">
                  💡 {quickStartSteps[currentStep].action}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              
              <div className="flex gap-2">
                {quickStartSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              {currentStep < quickStartSteps.length - 1 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>
                  Next
                </Button>
              ) : (
                <Button onClick={() => setShowQuickStart(false)}>
                  Get Started!
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
