'use client';

import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-semibold text-zinc-200">Authentication Removed</h1>
        <p className="text-zinc-400 text-sm max-w-md">
          This app no longer requires authentication. You can use the editor directly.
        </p>
        <Link
          href="/enter"
          className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-sm transition-colors"
        >
          Go to Editor
        </Link>
      </div>
    </div>
  );
}
