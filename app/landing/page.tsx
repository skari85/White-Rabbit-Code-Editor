'use client';

import MiniCodeEditor from '@/components/mini-code-editor';
import { Button } from '@/components/ui/button';
import { Brain, Code2, Rocket, Terminal, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="flex justify-between items-center p-6 max-w-7xl mx-auto">
          <div className="flex items-center">
            <Code2 className="w-6 h-6 text-gray-400 mr-2" />
            <span className="text-gray-100 font-mono text-sm tracking-wider">WHITE RABBIT</span>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/setup" className="text-gray-400 hover:text-gray-200 transition-colors text-sm font-mono">
              setup
            </Link>
            <Link href="/visual-tools" className="text-gray-400 hover:text-gray-200 transition-colors text-sm font-mono">
              visual-tools
            </Link>
            <Link href="/enter">
              <Button className="bg-zinc-800 hover:bg-zinc-700 text-gray-100 border border-zinc-700 font-mono text-sm">
                enter
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-mono font-light text-gray-100 leading-tight">
                build web apps<br />
                <span className="text-gray-400">with AI by your side</span>
              </h1>
              
              <p className="text-lg text-gray-400 leading-relaxed font-mono">
                a visual code editor that helps you create web applications faster. perfect for developers who want AI assistance without leaving their workflow.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/enter">
                <Button size="lg" className="bg-zinc-800 hover:bg-zinc-700 text-gray-100 border border-zinc-700 font-mono text-sm px-8 py-4">
                  start building
                </Button>
              </Link>
              <Link href="/visual-tools">
                <Button size="lg" variant="outline" className="border-zinc-700 text-gray-400 hover:bg-zinc-800 hover:text-gray-200 font-mono text-sm px-8 py-4">
                  see the tools
                </Button>
              </Link>
            </div>

            {/* Who This Is For */}
            <div className="pt-8">
              <div className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">who's this for?</div>
              <div className="space-y-3">
                <div className="flex items-start text-gray-400 font-mono text-sm">
                  <Users className="w-4 h-4 text-gray-600 mr-3 mt-0.5" />
                  <span>web developers building modern applications</span>
                </div>
                <div className="flex items-start text-gray-400 font-mono text-sm">
                  <Brain className="w-4 h-4 text-gray-600 mr-3 mt-0.5" />
                  <span>developers who want AI coding assistance</span>
                </div>
                <div className="flex items-start text-gray-400 font-mono text-sm">
                  <Rocket className="w-4 h-4 text-gray-600 mr-3 mt-0.5" />
                  <span>teams who prefer visual tools over command lines</span>
                </div>
              </div>
            </div>

            {/* What You Get */}
            <div className="pt-8 border-t border-zinc-800">
              <div className="text-sm font-mono text-gray-500 uppercase tracking-wider mb-4">what you get</div>
              <div className="space-y-3">
                <div className="flex items-start text-gray-400 font-mono text-sm">
                  <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                  <span>AI code generation & intelligent suggestions</span>
                </div>
                <div className="flex items-start text-gray-400 font-mono text-sm">
                  <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                  <span>visual git history and code flow analysis</span>
                </div>
                <div className="flex items-start text-gray-400 font-mono text-sm">
                  <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                  <span>built-in terminal with instant preview</span>
                </div>
                <div className="flex items-start text-gray-400 font-mono text-sm">
                  <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                  <span>zero setup - just code and deploy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Code Editor */}
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-400">live coding demo</span>
              </div>
              <p className="text-xs text-gray-500 font-mono">
                experience the editor • ai assistance • instant preview
              </p>
            </div>
            
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
              <MiniCodeEditor />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="border-t border-zinc-800 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-mono font-light text-gray-100 mb-4">
              built for modern web development
            </h2>
            <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
              everything you need to build, test, and deploy web applications in one place
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-300">ai-powered coding</span>
              </div>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                get code suggestions, generate components, and receive intelligent debugging help powered by advanced AI
              </p>
            </div>
            
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-300">visual tools</span>
              </div>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                see your code structure, track changes visually, and understand your project's architecture at a glance
              </p>
            </div>
            
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-300">rapid deployment</span>
              </div>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                build, test, and deploy your web applications with integrated tools and instant preview capabilities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose White Rabbit */}
      <section className="border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-mono font-light text-gray-100 mb-4">
              why developers choose white rabbit
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <h3 className="text-lg font-mono text-gray-300 mb-3">visual-first approach</h3>
              <p className="text-sm text-gray-500 font-mono leading-relaxed">
                instead of memorizing complex commands, use visual tools to understand and manage your code
              </p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-mono text-gray-300 mb-3">ai that actually helps</h3>
              <p className="text-sm text-gray-500 font-mono leading-relaxed">
                get relevant code suggestions and intelligent assistance without interrupting your workflow
              </p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-mono text-gray-300 mb-3">zero configuration</h3>
              <p className="text-sm text-gray-500 font-mono leading-relaxed">
                start coding immediately. no setup, no complex configuration, just pure development
              </p>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-mono text-gray-300 mb-3">team collaboration</h3>
              <p className="text-sm text-gray-500 font-mono leading-relaxed">
                built-in sharing and collaboration features for teams working on web projects together
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-500 font-mono text-xs">&copy; 2025 white rabbit. all rights reserved.</p>
            <div className="mt-4 space-x-6 text-xs font-mono">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-400 transition-colors">privacy</Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-400 transition-colors">terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
