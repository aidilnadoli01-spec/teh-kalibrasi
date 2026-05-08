# 📄 `src/app/layout.tsx`

## Deskripsi
File ini adalah **root layout** dari seluruh aplikasi Next.js. Semua halaman di dalam folder `app/` akan dibungkus oleh layout ini secara otomatis.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe file** | Server Component (tidak ada `'use client'`) |
| **Peran** | Membungkus semua halaman dengan HTML dasar, font global, dan session provider |

---

## Isi File

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Tehkalibrasi | The Art of Precise Brewing",
  description: "Experience the ultimate tea scrollytelling...",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Penjelasan Bagian Kode

### 1. `metadata`
```ts
export const metadata: Metadata = {
  title: "Tehkalibrasi | The Art of Precise Brewing",
  description: "...",
};
```
- Mendefinisikan **meta tag** halaman (title & description) untuk SEO.
- Ditampilkan di tab browser dan hasil pencarian Google.

### 2. `import "./globals.css"`
- Mengimpor CSS global yang berisi style dasar (font, warna background, dsb).
- Berlaku untuk semua halaman dalam aplikasi.

### 3. `<Providers>`
- Komponen dari `@/components/Providers.tsx`.
- Membungkus semua halaman dengan `<SessionProvider>` dari NextAuth.
- Memungkinkan semua komponen anak menggunakan `useSession()` untuk cek login.

### 4. `<body className="antialiased">`
- Kelas `antialiased` membuat teks terlihat lebih halus di layar.

---

## Relasi dengan File Lain

```
layout.tsx
  └── menggunakan → Providers.tsx
  └── mengimpor   → globals.css
  └── membungkus  → semua halaman (page.tsx)
```

---

## Catatan
- File ini **tidak perlu diubah** kecuali ada kebutuhan menambahkan font global, analytics script, atau meta tag baru.
- Karena ini Server Component, tidak bisa menggunakan `useState` atau `useEffect` di sini.
