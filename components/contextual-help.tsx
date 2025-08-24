'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  BookOpen, 
  Video, 
  ExternalLink, 
  Lightbulb,
  Code,
  GitBranch,
  Blocks,
  Eye,
  Terminal,
  Palette,
  Keyboard,
  Zap,
  FileText,
  Settings,
  ChevronRight,
  Search
} from 'lucide-react';

// Help context for managing help state across the app
interface HelpContextType {
  showHelp: (topic: string, context?: any) => void;
  hideHelp: () => void;
  isHelpVisible: boolean;
  currentTopic: string | null;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
};

// Help topics and their content
interface HelpTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  content: React.ReactNode;
  relatedTopics: string[];
  videoUrl?: string;
  externalDocs?: string;
}

const HELP_TOPICS: Record<string, HelpTopic> = {
  'code-editor': {
    id: 'code-editor',
    title: 'Code Editor',
    description: 'Professional code editing with Monaco Editor',
    icon: <Code className="w-5 h-5" />,
    category: 'Core Features',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Getting Started</h4>
          <p className="text-sm text-gray-600 mb-3">
            The code editor provides a professional development experience with syntax highlighting, 
            autocomplete, and error detection.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Quick Tips:</h5>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+Space</kbd> for autocomplete</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+/</kbd> to comment/uncomment lines</li>
              <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">F12</kbd> to go to definition</li>
              <li>• Use <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Ctrl+F</kbd> for find and replace</li>
            </ul>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Supported Languages</h4>
          <div className="flex flex-wrap gap-2">
            {['JavaScript', 'TypeScript', 'HTML', 'CSS', 'JSON', 'Python', 'Java', 'C++'].map(lang => (
              <Badge key={lang} variant="outline" className="text-xs">
                {lang}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Syntax highlighting and error detection</li>
            <li>• Intelligent autocomplete and IntelliSense</li>
            <li>• Multi-cursor editing and find/replace</li>
            <li>• Code folding and minimap</li>
            <li>• Git integration and diff view</li>
          </ul>
        </div>
      </div>
    ),
    relatedTopics: ['visual-programming', 'file-management', 'git-integration']
  },
  
  'visual-programming': {
    id: 'visual-programming',
    title: 'Visual Programming',
    description: 'Create logic flows with blocks instead of code',
    icon: <Blocks className="w-5 h-5" />,
    category: 'Core Features',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">What is Visual Programming?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Visual programming allows you to create applications by dragging and dropping blocks 
            instead of writing traditional code. Perfect for beginners and rapid prototyping.
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Getting Started</h4>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Switch to the <strong>Visual</strong> tab in the main editor</li>
            <li>Choose a template from the right panel (start with "Counter App")</li>
            <li>Drag blocks from the toolbox to the workspace</li>
            <li>Connect blocks by dragging them near each other</li>
            <li>Click "Generate Code" to convert to JavaScript</li>
          </ol>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Block Categories</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Logic', desc: 'If statements, comparisons, boolean operations' },
              { name: 'Loops', desc: 'For loops, while loops, repeat blocks' },
              { name: 'Math', desc: 'Numbers, arithmetic, mathematical functions' },
              { name: 'Text', desc: 'String operations and text output' },
              { name: 'Variables', desc: 'Create and manage variables' },
              { name: 'Functions', desc: 'Define and call functions' }
            ].map(cat => (
              <div key={cat.name} className="bg-gray-50 p-2 rounded">
                <div className="font-medium text-sm">{cat.name}</div>
                <div className="text-xs text-gray-600">{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">💡 Pro Tips:</h5>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Start with simple templates to understand the concept</li>
            <li>• Use the grid to align blocks neatly</li>
            <li>• Save your work as custom templates for reuse</li>
            <li>• The generated code can be further edited in the code editor</li>
          </ul>
        </div>
      </div>
    ),
    relatedTopics: ['code-editor', 'templates', 'code-generation']
  },
  
  'git-integration': {
    id: 'git-integration',
    title: 'Git Integration',
    description: 'Version control and GitHub integration',
    icon: <GitBranch className="w-5 h-5" />,
    category: 'Features',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Git Basics</h4>
          <p className="text-sm text-gray-600 mb-3">
            Git integration allows you to version control your projects and collaborate with others 
            through GitHub integration.
          </p>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Getting Started</h4>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Configure GitHub integration in the Git panel</li>
            <li>Initialize a Git repository with <code className="bg-gray-100 px-1 rounded">git init</code></li>
            <li>Add files with <code className="bg-gray-100 px-1 rounded">git add .</code></li>
            <li>Make your first commit with a meaningful message</li>
            <li>Connect to GitHub and push your code</li>
          </ol>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Essential Commands</h4>
          <div className="space-y-2">
            {[
              { cmd: 'git init', desc: 'Initialize a new repository' },
              { cmd: 'git status', desc: 'Check repository status' },
              { cmd: 'git add .', desc: 'Stage all changes' },
              { cmd: 'git commit -m "message"', desc: 'Commit changes with message' },
              { cmd: 'git push origin main', desc: 'Push to GitHub' }
            ].map(item => (
              <div key={item.cmd} className="flex items-center gap-3">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{item.cmd}</code>
                <span className="text-sm text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">📚 Documentation:</h5>
          <p className="text-sm text-blue-800">
            Check the <strong>Git Setup Guide</strong> for detailed configuration instructions 
            and troubleshooting tips.
          </p>
        </div>
      </div>
    ),
    relatedTopics: ['terminal', 'deployment', 'collaboration']
  },
  
  'keyboard-shortcuts': {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Boost productivity with keyboard shortcuts',
    icon: <Keyboard className="w-5 h-5" />,
    category: 'Advanced',
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Essential Shortcuts</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'Ctrl+K', desc: 'Open Command Palette' },
              { key: 'Ctrl+Shift+P', desc: 'Show All Commands' },
              { key: 'Ctrl+N', desc: 'New File' },
              { key: 'Ctrl+S', desc: 'Save File' },
              { key: 'Ctrl+F', desc: 'Find in File' },
              { key: 'Ctrl+H', desc: 'Find and Replace' },
              { key: 'Ctrl+Z', desc: 'Undo' },
              { key: 'Ctrl+Y', desc: 'Redo' },
              { key: 'Ctrl+/', desc: 'Toggle Comment' },
              { key: 'F12', desc: 'Go to Definition' }
            ].map(shortcut => (
              <div key={shortcut.key} className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{shortcut.key}</kbd>
                <span className="text-sm text-gray-600">{shortcut.desc}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Editor Shortcuts</h4>
          <div className="space-y-2">
            {[
              { key: 'Ctrl+Space', desc: 'Trigger Suggestions' },
              { key: 'Ctrl+Shift+Space', desc: 'Trigger Parameter Hints' },
              { key: 'Alt+Shift+F', desc: 'Format Document' },
              { key: 'Ctrl+Shift+M', desc: 'Toggle Problems Panel' },
              { key: 'Ctrl+B', desc: 'Toggle Sidebar' },
              { key: 'Ctrl+J', desc: 'Toggle Panel' }
            ].map(shortcut => (
              <div key={shortcut.key} className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{shortcut.key}</kbd>
                <span className="text-sm text-gray-600">{shortcut.desc}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-lg">
          <h5 className="font-medium text-yellow-900 mb-2">💡 Tip:</h5>
          <p className="text-sm text-yellow-800">
            Hover over buttons and menu items to see their keyboard shortcuts. 
            You can also customize shortcuts in the Settings panel.
          </p>
        </div>
      </div>
    ),
    relatedTopics: ['command-palette', 'settings', 'productivity']
  }
};

// Help Provider Component
export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);

  const showHelp = (topic: string, context?: any) => {
    setCurrentTopic(topic);
    setIsHelpVisible(true);
  };

  const hideHelp = () => {
    setIsHelpVisible(false);
    setCurrentTopic(null);
  };

  return (
    <HelpContext.Provider value={{ showHelp, hideHelp, isHelpVisible, currentTopic }}>
      {children}
      <ContextualHelp 
        isVisible={isHelpVisible} 
        topic={currentTopic} 
        onClose={hideHelp} 
      />
    </HelpContext.Provider>
  );
}

// Main Help Component
interface ContextualHelpProps {
  isVisible: boolean;
  topic: string | null;
  onClose: () => void;
  onTopicChange?: (topic: string) => void;
}

export function ContextualHelp({ isVisible, topic, onClose, onTopicChange }: ContextualHelpProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isVisible || !topic) return null;

  const currentTopic = HELP_TOPICS[topic];
  const categories = Array.from(new Set(Object.values(HELP_TOPICS).map(t => t.category)));
  
  const filteredTopics = Object.values(HELP_TOPICS).filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Help & Documentation</h2>
              <p className="text-sm text-gray-600">Get help with White Rabbit Code Editor</p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-80 border-r bg-gray-50 p-4">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search help topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {filteredTopics.map(topic => (
                <div
                  key={topic.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentTopic?.id === topic.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-white'
                  }`}
                  onClick={() => onTopicChange?.(topic.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                      {topic.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{topic.title}</div>
                      <div className="text-xs text-gray-600 truncate">{topic.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentTopic ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {currentTopic.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{currentTopic.title}</h3>
                    <p className="text-gray-600">{currentTopic.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{currentTopic.category}</Badge>
                      {currentTopic.videoUrl && (
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Watch Video
                        </Button>
                      )}
                      {currentTopic.externalDocs && (
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Documentation
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="prose max-w-none">
                  {currentTopic.content}
                </div>

                {currentTopic.relatedTopics.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h4 className="font-medium mb-3">Related Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentTopic.relatedTopics.map(relatedId => {
                        const related = HELP_TOPICS[relatedId];
                        if (!related) return null;
                        return (
                          <Button
                            key={relatedId}
                            variant="outline"
                            size="sm"
                            onClick={() => onTopicChange?.(related.id)}
                            className="flex items-center gap-2"
                          >
                            {related.icon}
                            {related.title}
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Help Topic</h3>
                <p className="text-gray-600">Choose a topic from the sidebar to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Help Button Component
export function HelpButton({ topic, context, children }: { 
  topic: string; 
  context?: any; 
  children: React.ReactNode;
}) {
  const { showHelp } = useHelp();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => showHelp(topic, context)}
      className="flex items-center gap-2"
    >
      <HelpCircle className="w-4 h-4" />
      {children}
    </Button>
  );
}
