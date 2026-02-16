'use client';

import CodeEditor from '@/components/code-editor';
import { ErrorBoundary } from '@/components/error-boundary';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AudioRecorder = dynamic(() => import('@/components/audio-recorder'), { ssr: false });

export default function EnterEditor() {
  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-background">
        <CodeEditor />
        <div className="fixed left-4 bottom-4 z-50 max-w-md">
          <AudioRecorder />
        </div>
        <div className="fixed bottom-4 right-4 z-50 flex gap-2">
          <Link
            href="/w"
            className="rounded-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 text-sm"
          >
            Workspace
          </Link>
          <Link
            href="/visual-tools"
            className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 text-sm"
          >
            Visual Tools
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  );
}
