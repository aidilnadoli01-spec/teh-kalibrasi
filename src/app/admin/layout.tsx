import { AdminSessionProvider } from '@/components/AdminSessionProvider';

/**
 * Layout khusus untuk semua route /admin/*
 * Menggunakan AdminSessionProvider yang terpisah dari SessionProvider utama.
 * Ini memastikan admin session dan user session tidak pernah bercampur.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionProvider>
      {children}
    </AdminSessionProvider>
  );
}
