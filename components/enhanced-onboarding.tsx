'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Code, 
  GitBranch, 
  Palette, 
  Rocket, 
  Eye, 
  Blocks, 
  Terminal,
  Keyboard,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
  FileText,
  Settings,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'core' | 'features' | 'advanced';
  duration: number; // estimated seconds
  actions: string[];
  tips: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  // Core Features
  {
    id: 'welcome',
    title: 'Welcome to White Rabbit Code Editor',
    description: 'Your all-in-one development environment for no-code, low-code, and traditional programming.',
    icon: <Rocket className="w-6 h-6" />,
    category: 'core',
    duration: 30,
    actions: ['Explore the interface', 'Understand the layout'],
    tips: ['Take your time exploring each section', 'Use the tabs to switch between different views']
  },
  {
    id: 'code-editor',
    title: 'Code Editor',
    description: 'Professional code editing with Monaco Editor - syntax highlighting, autocomplete, and error detection.',
    icon: <Code className="w-6 h-6" />,
    category: 'core',
    duration: 60,
    actions: ['Write some code', 'Try syntax highlighting', 'Use autocomplete'],
    tips: ['Press Ctrl+Space for autocomplete', 'Use Ctrl+/ to comment/uncomment lines', 'Press F12 to go to definition']
  },
  {
    id: 'visual-programming',
    title: 'Visual Programming',
    description: 'Create logic flows without writing code using Blockly blocks. Perfect for beginners and rapid prototyping.',
    icon: <Blocks className="w-6 h-6" />,
    category: 'core',
    duration: 120,
    actions: ['Switch to Visual tab', 'Try a template', 'Drag and drop blocks', 'Generate code'],
    tips: ['Start with the Counter App template', 'Use the Quick Start guide', 'Blocks snap together automatically']
  },
  {
    id: 'file-management',
    title: 'File Management',
    description: 'Organize your project with multiple files, folders, and real-time collaboration.',
    icon: <FileText className="w-6 h-6" />,
    category: 'core',
    duration: 45,
    actions: ['Create a new file', 'Organize files in folders', 'Use the file explorer'],
    tips: ['Right-click to create new files', 'Drag and drop to reorganize', 'Use Ctrl+N for new files']
  },
  
  // Feature Overview
  {
    id: 'git-integration',
    title: 'Git Integration',
    description: 'Version control your projects with built-in Git support and GitHub integration.',
    icon: <GitBranch className="w-6 h-6" />,
    category: 'features',
    duration: 90,
    actions: ['Initialize Git repository', 'Make your first commit', 'Connect to GitHub'],
    tips: ['Use meaningful commit messages', 'Check the Git Setup guide for configuration', 'Use the Terminal tab to see Git output']
  },
  {
    id: 'live-preview',
    title: 'Live Preview',
    description: 'See your changes in real-time with the live preview system.',
    icon: <Eye className="w-6 h-6" />,
    category: 'features',
    duration: 60,
    actions: ['Open live preview', 'Make changes and see updates', 'Use different viewports'],
    tips: ['Preview updates automatically as you type', 'Use the device selector for responsive testing', 'Toggle between code and preview']
  },
  {
    id: 'visual-tools',
    title: 'Visual Tools',
    description: 'Explore Git History, Smart File Tree, and Code Flow visualizers in one place.',
    icon: <Sparkles className="w-6 h-6" />,
    category: 'features',
    duration: 60,
    actions: ['Open Visual Tools from the top bar', 'Or use the FAB on the home screen', 'Switch between Git History, File Tree, and Code Flow tabs'],
    tips: ['Use fullscreen for focused exploration', 'Great for quick project orientation']
  },
  {
    id: 'terminal',
    title: 'Integrated Terminal',
    description: 'Run commands, install packages, and manage your development environment.',
    icon: <Terminal className="w-6 h-6" />,
    category: 'features',
    duration: 45,
    actions: ['Open terminal', 'Run npm commands', 'Install packages'],
    tips: ['Use Ctrl+` to toggle terminal', 'Terminal supports all standard commands', 'Use the Terminal tab for Git operations']
  },
  {
    id: 'data-science',
    title: 'Data Science Hub',
    description: 'Plot, analyze, and explore data with built-in visual tools for data workflows.',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'features',
    duration: 60,
    actions: ['Open the Data Science page', 'Create a quick plot', 'Explore pipeline components'],
    tips: ['Great for CSV exploration', 'Use alongside the editor for notebooks or scripts']
  },
  {
    id: 'customization',
    title: 'Customization',
    description: 'Personalize your editor with themes, fonts, and layout options.',
    icon: <Palette className="w-6 h-6" />,
    category: 'features',
    duration: 60,
    actions: ['Open Style panel', 'Change theme', 'Adjust fonts, radius, and shadows'],
    tips: ['Style changes apply instantly', 'Use layout controls to reconfigure panes']
  },
  
  // Advanced Features
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Boost your productivity with powerful keyboard shortcuts and commands.',
    icon: <Keyboard className="w-6 h-6" />,
    category: 'advanced',
    duration: 90,
    actions: ['Open Command Palette (Ctrl+K)', 'Learn essential shortcuts', 'Customize shortcuts'],
    tips: ['Press Ctrl+K to open command palette', 'Use Ctrl+Shift+P for all commands', 'Shortcuts are shown in tooltips']
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Get intelligent code suggestions, debugging help, and programming guidance.',
    icon: <Zap className="w-6 h-6" />,
    category: 'advanced',
    duration: 120,
    actions: ['Open AI Chat', 'Ask for code help', 'Get debugging assistance'],
    tips: ['Be specific in your questions', 'AI can help with multiple languages', 'Use for code review and optimization']
  },
  {
    id: 'editor-ux',
    title: 'Polished Editor UX',
    description: 'Experience a breathing caret and Focus Field ripple highlighting for calmer, tactile feedback.',
    icon: <Eye className="w-6 h-6" />,
    category: 'advanced',
    duration: 30,
    actions: ['Click a line to see the ripple highlight', 'Observe the gentle caret fade'],
    tips: ['Animations respect reduced motion settings', 'Designed to reduce visual fatigue']
  },
  {
    id: 'deployment',
    title: 'Deployment',
    description: 'Deploy your projects directly to Vercel with one-click publishing.',
    icon: <Rocket className="w-6 h-6" />,
    category: 'advanced',
    duration: 60,
    actions: ['Use Publish button', 'Configure deployment', 'Monitor deployment status'],
    tips: ['Connect your GitHub account first', 'Customize domain settings', 'Check deployment logs for issues']
  }
];

interface EnhancedOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function EnhancedOnboarding({ isOpen, onClose, onComplete }: EnhancedOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showTips, setShowTips] = useState(false);
  const [autoProgress, setAutoProgress] = useState(false);

  // Load progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wr-onboarding-progress');
      if (saved) {
        setCompletedSteps(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.warn('Failed to load onboarding progress:', error);
    }
  }, []);

  // Save progress to localStorage
  const saveProgress = (stepId: string) => {
    const newCompleted = new Set(completedSteps).add(stepId);
    setCompletedSteps(newCompleted);
    try {
      localStorage.setItem('wr-onboarding-progress', JSON.stringify([...newCompleted]));
    } catch (error) {
      console.warn('Failed to save onboarding progress:', error);
    }
  };

  // Auto-progress through steps
  useEffect(() => {
    if (autoProgress && isOpen) {
      const timer = setTimeout(() => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
          nextStep();
        } else {
          setAutoProgress(false);
        }
      }, ONBOARDING_STEPS[currentStep].duration * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoProgress, currentStep, isOpen]);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setShowTips(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setShowTips(false);
    }
  };

  const completeStep = () => {
    const currentStepId = ONBOARDING_STEPS[currentStep].id;
    saveProgress(currentStepId);
    
    if (currentStep === ONBOARDING_STEPS.length - 1) {
      onComplete();
    } else {
      nextStep();
    }
  };

  const skipToEnd = () => {
    // Mark all steps as completed
    const allStepIds = ONBOARDING_STEPS.map(step => step.id);
    setCompletedSteps(new Set(allStepIds));
    try {
      localStorage.setItem('wr-onboarding-progress', JSON.stringify(allStepIds));
    } catch (error) {
      console.warn('Failed to save onboarding progress:', error);
    }
    onComplete();
  };

  if (!isOpen) return null;

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = (completedSteps.size / ONBOARDING_STEPS.length) * 100;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">White Rabbit Code Editor</h2>
              <p className="text-xs sm:text-sm text-gray-600">Interactive Onboarding</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoProgress(!autoProgress)}
              className={`text-xs ${autoProgress ? 'bg-green-100 border-green-300' : ''}`}
            >
              {autoProgress ? 'Auto' : 'Manual'}
            </Button>
            <Button variant="ghost" size="sm" onClick={skipToEnd} className="text-xs">
              Skip All
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-3 sm:px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
            <span>Progress: {Math.round(progress)}%</span>
            <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Main Content */}
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {currentStepData.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{currentStepData.title}</h3>
                  <Badge variant={currentStepData.category === 'core' ? 'default' : currentStepData.category === 'features' ? 'secondary' : 'outline'} className="text-xs">
                    {currentStepData.category}
                  </Badge>
                </div>
              </div>

              <p className="text-gray-700 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                {currentStepData.description}
              </p>

              {/* Actions */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Play className="w-4 h-4" />
                  Try These Actions:
                </h4>
                <div className="space-y-2">
                  {currentStepData.actions.map((action, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs sm:text-sm">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="mb-4 sm:mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTips(!showTips)}
                  className="flex items-center gap-2 text-xs sm:text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showTips ? 'Hide' : 'Show'} Pro Tips
                </Button>
                
                {showTips && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="font-medium text-blue-900 mb-2 text-sm">💡 Pro Tips:</h5>
                    <ul className="space-y-1 text-xs sm:text-sm text-blue-800">
                      {currentStepData.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-600 flex-shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Hidden on mobile, shown on larger screens */}
            <div className="hidden lg:block lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Onboarding Steps</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {ONBOARDING_STEPS.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          index === currentStep
                            ? 'bg-blue-50 border-l-4 border-blue-500'
                            : completedSteps.has(step.id)
                            ? 'bg-green-50 border-l-4 border-green-500'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentStep(index)}
                      >
                        <div className="flex items-center gap-2">
                          {completedSteps.has(step.id) ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                          )}
                          <span className={`text-sm ${
                            index === currentStep ? 'font-medium text-blue-900' : 
                            completedSteps.has(step.id) ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            {step.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {step.duration}s
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {step.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer - Always visible and mobile-friendly */}
        <div className="border-t p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowTips(!showTips)}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <HelpCircle className="w-4 h-4 mr-1 sm:mr-2" />
              {showTips ? 'Hide' : 'Show'} Tips
            </Button>
          </div>

          <div className="flex items-center gap-2 order-1 sm:order-2">
            {!isLastStep ? (
              <Button onClick={completeStep} className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm">
                Next
                <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
              </Button>
            ) : (
              <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
