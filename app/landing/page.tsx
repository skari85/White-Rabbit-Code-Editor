'use client';

import MiniCodeEditor from '@/components/mini-code-editor';
import { Button } from '@/components/ui/button';
import { Code2, Github, Brain, Lock } from 'lucide-react';
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
                build faster with<br />
                <span className="text-gray-400">ai-powered code space</span>
              </h1>
              
              <p className="text-lg text-gray-400 leading-relaxed font-mono">
                minimal, fast web code editor with github integration, byok ai, and zero server storage.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/enter">
                <Button size="lg" className="bg-zinc-800 hover:bg-zinc-700 text-gray-100 border border-zinc-700 font-mono text-sm px-8 py-4">
                  enter white rabbit
                </Button>
              </Link>
              <Link href="/visual-tools">
                <Button size="lg" variant="outline" className="border-zinc-700 text-gray-400 hover:bg-zinc-800 hover:text-gray-200 font-mono text-sm px-8 py-4">
                  explore tools
                </Button>
              </Link>
            </div>

            {/* Feature List */}
            <div className="space-y-3 pt-8">
              <div className="flex items-start text-gray-400 font-mono text-sm">
                <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                <span>github integration — browse repos, edit files, commit directly</span>
              </div>
              <div className="flex items-start text-gray-400 font-mono text-sm">
                <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                <span>byok ai — bring your own api key (openai, anthropic, groq)</span>
              </div>
              <div className="flex items-start text-gray-400 font-mono text-sm">
                <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                <span>client-side only — zero server storage, all data stays in browser</span>
              </div>
              <div className="flex items-start text-gray-400 font-mono text-sm">
                <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                <span>ai editor actions — explain, refactor, fix, generate, document</span>
              </div>
              <div className="flex items-start text-gray-400 font-mono text-sm">
                <span className="text-gray-600 mr-3 mt-1">{'>'}</span>
                <span>open project from github — browse repos, select branch, load files</span>
              </div>
            </div>

            {/* Technical Details */}
            <div className="pt-8 border-t border-zinc-800">
              <div className="space-y-2">
                <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">privacy first</div>
                <div className="text-sm font-mono text-gray-400">
                  no server storage • no token proxying • all operations client-side
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">tech stack</div>
                <div className="text-sm font-mono text-gray-400">
                  next.js 15 • react 19 • monaco editor • github api • byok ai
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Code Editor */}
          <div className="space-y-4">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Code2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-400">monaco editor</span>
              </div>
              <p className="text-xs text-gray-500 font-mono">
                syntax highlighting • multiple languages • github integration • ai assistance
              </p>
            </div>
            
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/50">
              <MiniCodeEditor />
            </div>
          </div>
        </div>
      </div>

      {/* Code Sample Section */}
      <section className="border-t border-zinc-800 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-mono font-light text-gray-100 mb-4">
              code with privacy
            </h2>
            <p className="text-gray-400 font-mono text-sm max-w-2xl mx-auto">
              clean interface, powerful features, zero server storage — all operations stay in your browser
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Cards */}
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Github className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-300">github integration</span>
              </div>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                browse repos, edit files, commit changes — all client-side with your token
              </p>
            </div>
            
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-300">byok ai</span>
              </div>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                bring your own api key — openai, anthropic, groq, or custom endpoint
              </p>
            </div>
            
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-300">privacy first</span>
              </div>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                zero server storage — all operations happen directly in your browser
              </p>
            </div>
            
            <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-mono text-gray-300">ai editor actions</span>
              </div>
              <p className="text-xs text-gray-500 font-mono leading-relaxed">
                explain code, refactor, fix errors, generate functions — powered by your ai
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
