'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: Props) {
  return (
    <SessionProvider
      session={null}
      // Disable automatic session fetching to prevent 500 errors
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
