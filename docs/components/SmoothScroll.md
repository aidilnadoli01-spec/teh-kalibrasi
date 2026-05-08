# 📄 `src/components/SmoothScroll.tsx`

## Deskripsi
Sebuah **Wrapper / Provider Komponen** yang menghidupkan fitur **Smooth Scrolling**. Membungkus halaman untuk memodifikasi cara scroll natural peramban/browser (menjadi lengket/halus bak dilumasi minyak).

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Pustaka** | [Lenis](https://lenis.studiofreight.com/) |
| **Peran** | Wrapper tingkat-halaman |

---

## Implementasi Kode
Di dalam `useEffect`, diinisialisasilah `Lenis`.
```tsx
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  // ... parameter lain
});
```

Sebuah perulangan rendering visual dibuat memakai `requestAnimationFrame`:
```tsx
function raf(time: number) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
```
Lalu saat *unmout*, ia `lenis.destroy()` agar tidak bocor alokasi memorinya.

---

## Relasi Pemakaian
Bisa disisipkan di level manapun asalkan merengkuh area *scrolling* utama. Saat ini terlihat digunakan di `app/page.tsx` membungkus elemen `<main>`.

---

## Dampak
- Segala efek bergulir yang diatur `framer-motion` via `useScroll` akan mendapatkan *update frame* data gulir jauh lebih presisi dan terkesan mahal.
