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
    // Proper authentication flow
    if (status === 'unauthenticated') {
      // Check if authentication is configured
      const hasGitHubAuth = process.env.NODE_ENV === 'development' ||
        (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);

      if (hasGitHubAuth) {
        router.push('/auth/signin');
      }
      // In development without GitHub auth configured, allow access with demo mode
      // In production without auth, this will cause issues - by design
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

  // Handle unauthenticated state (only in production without auth configured)
  if (status === 'unauthenticated' && !process.env.NEXT_PHASE && process.env.NODE_ENV === 'production') {
    return (
      <div className="w-full h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-black dark:text-gray-100 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              GitHub authentication is not configured. Please contact the administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
