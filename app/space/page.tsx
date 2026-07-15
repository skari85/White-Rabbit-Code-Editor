'use client';

import { ErrorBoundary } from '@/components/error-boundary';
import dynamic from 'next/dynamic';

const CoderSpace = dynamic(() => import('@/components/coder-space'), {
  ssr: false,
});

export default function SpacePage() {
  return (
    <ErrorBoundary>
      <CoderSpace />
    </ErrorBoundary>
  );
}
