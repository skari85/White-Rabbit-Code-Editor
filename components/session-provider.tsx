'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Auth session provider stub — GitHub authentication has been removed.
 * This is now a simple passthrough so any remaining imports don't break.
 */
export function AuthSessionProvider({ children }: Props) {
  return <>{children}</>;
}
