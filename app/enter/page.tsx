'use client';

import CodeEditor from '@/components/code-editor';
import { ErrorBoundary } from '@/components/error-boundary';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AudioRecorder = dynamic(() => import('@/components/audio-recorder'), {
  ssr: false,
});

export default function EnterEditor() {
  return (
    <ErrorBoundary>
      <div className='w-full h-screen bg-background'>
        <CodeEditor />
        {/* Single consolidated bottom action bar. Previously this was two
            independent `fixed bottom-4` overlays (mic + workspace/visual
            tools) plus the global copyright footer, all fixed to the same
            corner — they collided on narrow viewports. Everything now lives
            in one row, kept above the copyright footer's band (fixed
            bottom-2, ~40px tall) and the editor's own minimized Live Coding
            bar (h-12) at every breakpoint, instead of trying to dodge them
            horizontally with padding that only worked at one text width. */}
        <div className='fixed inset-x-0 bottom-14 z-40 flex flex-wrap items-end justify-between gap-2 px-3 pointer-events-none'>
          <div className='pointer-events-auto max-w-[min(90vw,20rem)]'>
            <AudioRecorder />
          </div>
          <div className='pointer-events-auto flex gap-2'>
            <Link
              href='/w'
              className='rounded-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 text-sm whitespace-nowrap'
            >
              Workspace
            </Link>
            <Link
              href='/visual-tools'
              className='rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 text-sm whitespace-nowrap'
            >
              Visual Tools
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
