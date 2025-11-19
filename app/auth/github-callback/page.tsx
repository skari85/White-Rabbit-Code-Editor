'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitHubOAuth } from '@/lib/github-oauth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function GitHubCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing GitHub authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const success = await GitHubOAuth.handleCallback();
        if (success) {
          setStatus('success');
          setMessage('Successfully connected to GitHub! Redirecting...');
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/enter');
          }, 1500);
        } else {
          setStatus('error');
          setMessage('Failed to authenticate with GitHub. Please try again.');
        }
      } catch (error) {
        console.error('GitHub callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'An error occurred during authentication.');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-950 border-gray-800">
        <CardContent className="flex flex-col items-center justify-center py-12">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-300">{message}</p>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-gray-300">{message}</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-300 mb-4">{message}</p>
              <button
                onClick={() => router.push('/enter')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Go Back
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
