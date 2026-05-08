# 📄 `src/components/Providers.tsx`

## Deskripsi
Ini adalah komponen Provider sederhana yang bertugas menginjeksikan state keliling (global state) ke setiap simpul aplikasi. Fokus utamanya kali ini adalah untuk manajemen autensitfikasi (*NextAuth*).

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Lokasi** | Digunakan pada Root (`app/layout.tsx`) |
| **Kompenen Sibling** | Mengandalkan `SessionProvider` |

---

## Isi File

```tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

---

## Kenapa Dibutuhkan di File Terpisah?
`SessionProvider` memerlukan status **Client Component (`'use client'`)** karena memakai *context api / hook*, sedangkan `RootLayout` di Next.js 13+ defaultnya bertugas menangani hal via Server. Oleh karena itulah ia harus di-*extract* tersendiri baru kemudian disisipkan ke layout server.

Hal yang sama berlaku bila kelak akan ada Provider lainnya (seperti react-query, themes, dsb), dapat ditumpuk di dalam *file provider* ini.
