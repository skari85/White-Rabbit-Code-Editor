'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: Props) {
  return (
    <SessionProvider
      // Enable automatic session fetching for proper auth state
      refetchInterval={5 * 60} // Refetch every 5 minutes
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
