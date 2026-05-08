# 📄 `src/components/StatsSection.tsx`

## Deskripsi
Komponen untuk menayangkan metrik prestasi secara lugas dengan menampilkan Angka yang terus berjalan **"Ngitung Hitung" (Count Up Animated)** dimulai dari Nol memuncak ke digit besarnya sesaat di-scroll.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Eksekutor Angka** | Spring Fisika via Framer Motion State |

---

## Komponen `<CountUp>` (Logika Penghitung)
Untuk menciptakan perhitungan yang *hardware-accelerated*:
1. `useInView`: Mengecek apakah wadah angka ini sedang tayang di layar kaca pengguna.
2. `useSpring(0, ...)`: Jika dilihat, pelatuk ditarik menuju *target number / value*.
3. `useTransform`: Merawat format desimal, angkanya dicacah pakai `.toLocaleString()` (sehingga punya tanda komat-koma).
4. `useMotionValueEvent`: Berfungsi mengirim paksa *state React* lokal saat nilai angkanya mutasi. Lantas di-return berbalikan bersandingan imbuhan akhiran (jika ada seperti "%" atau "+").

---

## List Angka Disuguhkan
Array sederhana:
- Gardens Sourced: **42** (+)
- Tea Varieties: **156**
- Brews per Day: **12400**
- Precision Score: **99.9** (%)

Setiap parameter ditata pada susunan Grid 4 Kolom di *Desktop*, berserta aksen *divider* tipis batas bawah layarnya `border-y border-white/5`.
