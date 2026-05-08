# 📄 `src/components/Navbar.tsx`

## Deskripsi
File ini adalah komponen **navigasi utama** website. Menggunakan desain fullscreen menu overlay ketika tombol Menu diklik, dengan animasi super *smooth* menggunakan Framer Motion. Tombol Menu menggunakan garis (hamburger icon) yang akan berubah menjadi huruf 'X' saat terbuka.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Lokasi** | Diletakkan di atas setiap halaman, biasanya lewat `page.tsx` utama atau `file-file spesifik` |
| **Peran** | Navigasi menu, pengecekan Session (login/logout/register link) |

---

## State & Hooks

```tsx
const [isOpen, setIsOpen] = useState(false); // Mengatur status menu terbuka/tertutup
const { data: session, status } = useSession(); // Status login user
```

---

## Elemen Inti Dibalik Tampilan

### 1. Toggle Tombol Menu
Didesain unik, ada teks "Menu" (atau "Close") dan dua garis animasi:
```tsx
<div className="relative w-8 h-4 flex flex-col justify-between">
   <motion.div animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} ... />
   <motion.div animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} ... />
</div>
```
Garis akan turun/naik dan berputar (-45 dan 45 derajat) membentuk 'X' saat `isOpen == true`.

### 2. Animasi Menu Overlay
Dibungkus dengan `<AnimatePresence>` dari Framer Motion agar bisa dianimasikan saat dimunculkan (`variants={menuVariants}`) maupun saat dihilangkan. Backgroundnya adalah `bg-stone-900`.

### 3. List Menu
Menu di-render menggunakan *array mapping*:
```tsx
const menuItems = [
  { title: 'Home', href: '/' },
  { title: 'The Collection', href: '/products' },
  { title: 'Track Order', href: '/track-order' },
];
```
Setiap item menu diberikan *delay* animasi masuk secara *staggered* (muncul satu per satu berurutan).

### 4. Menu Autentikasi Dinamis
Bagian bawah dari menu akan berubah berdasarkan status login:
- **Jika Login (`status === 'authenticated'`)**: Tampil link `My Profile`, `My Wishlist`, dan tombol `Sign Out`.
- **Jika Belum Login**: Tampil link `Login` dan `Register`.

---

## Desain Tambahan
Di bagian kanan (pada mode Desktop), terdapat dua kolom teks untuk **Registry** (Social Media links) dan lokasi (Jakarta, Indonesia).

---

## Dependensi
- `framer-motion`: Animasi masuk menu dan elemen-elemennya.
- `next-auth/react`: Pengecekan sesi user.
- `next/link`: Navigasi (tetapi saat ini komponen memakai tag `<a>` biasa yang dibungkus `motion.a`).
