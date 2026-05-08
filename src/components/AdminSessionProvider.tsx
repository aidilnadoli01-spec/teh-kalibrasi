'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Provider untuk admin session.
 * Menggunakan basePath berbeda (/api/admin/auth) agar session
 * admin dan user TIDAK saling menimpa atau tertukar.
 */
export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/admin/auth">
      {children}
    </SessionProvider>
  );
}
