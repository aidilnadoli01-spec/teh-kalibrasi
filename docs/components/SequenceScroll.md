# 📄 `src/components/SequenceScroll.tsx`

## Deskripsi
Ini adalah komponen **Hero "Scrollytelling"** terbesar dalam sistem. Komponen ini memanfaatkan deretan frame gambar statik yang dirender cepat secara bergantian (melalui elemen Canvas) seiring dengan bertambahnya nilai *scroll*, mirip stop motion frame-by-frame. Di atasnya dimunculkan baris teks hero dinamis silih berganti.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Pustaka** | Canvas 2D + Framer Motion (`useScroll`, `useTransform`) |
| **Peran** | Layar Pemasaran Utama / Intro Hero Section |

---

## Tahap Logika Frame

### 1. Preload Gambar
Mengatur pemuatan `240` frame (konstanta `TOTAL_FRAMES = 240`) gambar dengan letak path `/sequence/ezgif-frame-001.jpg` dsbg sebelum interaksi dimulai. Pemanfaatan `new Image()` di baliknya.

### 2. Tangkai Scroll
```tsx
const { scrollYProgress } = useScroll({
  target: containerRef,
  offset: ["start start", "end end"]
});
const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
const frameIndex = useTransform(smoothProgress, [0, 1], [1, TOTAL_FRAMES]);
```
Perubahan progres dari *0 hingga 1* akan ditransformasi padat ke nilai index `1 sampai 240`.

### 3. Eksekusi Canvas 
Setiap kali `frameIndex` berganti angkanya, dijalankan perendengan citra ke memori internal `<canvas>`.
Logika rasio (Cover Fit):
- Mengukur kanvas layar vs dimensi gambar, ambil *ratio max* terkecil, dan kemudian memotong/mengisi ruang bolong dari kanvas itu (metode *drawImage* dengan margin).

---

## Timeline Lapis Teks Animasi Overlays
Ada empat *checkpoint* utama saat user melakukan aktivitas scroll dari awal titik 0 (0%) hingga akhir gulir komponen ini (100%):

1. **Titik 0 - 20%:** Penamaan judul utama *"Tehkalibrasi"* muncul di tengah atas.
2. **Titik 25 - 45%:** Slogan Kiri *"Crafted with patience..."* masuk lalu lenyap.
3. **Titik 55 - 75%:** Slogan Kanan *"Every leaf is a story..."* tampil menyamping.
4. **Titik 85 - 100%:** Kemunculan Tombol CTA *"Enter"* dengan menggunakan *magnetic component*.

---

## Spesifikasi Layout CSS
Sistem menipu kursor *scrollbar*: `h-[600vh]`
Komponen berwujud kotak raksasa sejauh 6 layar penuh tinggi. Elemen Visual (isi kanvas+tulisan) memiliki atribut `sticky top-0 h-screen`, sehingga visualisasi dipause secara layar seakan berhenti dan hanya angka gulirannya yang bertambah, sampai angka selesai dan wadah bisa digulir alami lagi ke Section bawah.
