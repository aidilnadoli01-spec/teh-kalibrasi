# 📄 `src/components/CtaSection.tsx`

## Deskripsi
Komponen Call to Action (CTA). Lapisan terakhir dalam hierarki pendaratan utama (*Home Page*) sebagai konklusi yang menarget dorongan pengguna agar segera meng-klik dan memesan ragam produk Teh.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Ketergantungan** | Memanfaatkan Wrapper Khusus: `<Magnetic>` |
| **Peran** | Titik *Conversions* (mempengaruhi *Click Through* pelanggan) |

---

## Visualisasi Latar Muka (UI Design)

### 1. Radial Background Bernafas
Kawasan paling belakang disuntik oleh objek bulatan cahaya hijau `<div bg-[radial-gradient...]>`. Elemen div ini tidak diam, dia dirantai pada properti `animate` Framer Motion yang terus menskalakan nafas debarnya (*scale up down*, berputar 360 derajat) tanpa hentian waktu (`Infinity`).

### 2. Teks Hipnotik
Disapa slogan besar `Join the Calibration.`, tulisan dinaikkan pelan saat pengguna menabrak lapis halamanya pertama kali secara transparan ke terang.

### 3. Modifikasi Tombol
Tombol di tengah dimanipulasi dengan balutan:
- Efek tarik magnet (`<Magnetic>`).
- Efek pembesaran pas disentuh (`hover:scale-105 active:scale-95`).
- Font besar tebal kapital (merujuk ke path navigasi situs tujuan `/products`).

### 4. *Watermark* Etnik
Coretan kecil tulislan vertikal "EST. 2024" ditaruh menepi di sisi ujung landasan, menggenjot corak desain elitist masa kini.
