'use client';

import CodeEditor from '@/components/code-editor';
import { ErrorBoundary } from '@/components/error-boundary';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const AudioRecorder = dynamic(() => import('@/components/audio-recorder'), { ssr: false });

export default function EnterEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated and not loading, redirect to sign-in
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render the editor (redirect will happen)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <ErrorBoundary>
      <div className="w-full h-screen bg-background">
        <CodeEditor />
        <div className="fixed left-4 bottom-4 z-50 max-w-md">
          <AudioRecorder />
        </div>
        <Link
          href="/visual-tools"
          className="fixed bottom-4 right-4 z-50 rounded-full bg-gradient-to-r from-purple-600 to-cyan-400 text-white px-4 py-2 shadow-lg hover:shadow-xl transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Visual Tools
        </Link>
      </div>
    </ErrorBoundary>
  );
}


