# 📄 `src/components/Footer.tsx`

## Deskripsi
File ini adalah komponen **Footer** yang ditampilkan di bagian paling bawah halaman web.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Lokasi** | Biasanya ditempatkan di halaman utama (`page.tsx`) atau layout dasar |
| **Peran** | Navigasi sekunder bawah, social media links, dan copyright |

---

## Elemen Tampilan

1. **Brand Intro (Atas Kiri)**
   Berisi teks "Tehkalibrasi" dengan deskripsi singkat mengenai filosofi teh mereka.
2. **Explore Menu (Atas Tengah)**
   Link sekunder seperti The Lab, Collections, Subscriptions, Journal.
3. **Contact Menu (Atas Kanan)**
   Link sosial media dan kontak: Instagram, TikTok, Email Us, Locate Store.
4. **Giant Text (Tengah Bawah)**
   Terdapat teks besar raksasa ("CALIBRATE") `text-[120px] md:text-[250px]` dengan tingkat opasitas rendah (`text-white/5`) sebagai background hiasan.
5. **Copyright Text (Kanan Bawah)**
   Tulisan kecil hak cipta.

---

## Relasi dengan File Lain
- Di-import langsung ke dalam struktur halaman utama (`app/page.tsx`) dan halaman statis lainnya (`app/profile/page.tsx`).

---

## Catatan Tambahan
Gaya CSS fokus pada border transparan (`border-white/5`), *hover state* yang bersih, serta desain ala grid untuk penempatan elemen dengan ukuran font yang dinamis (`font-outfit`).
