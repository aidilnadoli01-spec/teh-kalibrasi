# 📄 `src/components/BentoSection.tsx`

## Deskripsi
Merupakan komponen galeri informasi dengan penataan kotak layout catur modern bergaya UI asimetris yang biasa disebut **"Bento Box / Bento Grid UI"**. Menampilkan fitur dan filosofi produk.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Pola CSS Grid** | Grid bersilang lapis-2 berdimensi variasi |

---

## Data Objek (Konstan)
Data disuplai langsung melalui array objek kaku `bentoItems` berjumlah 4 item:
- **Kotak 1:** Origins (Berasal usul)
- **Kotak 2:** The Steam (Suhu)
- **Kotak 3:** Purity (Tanpa Pewarna)
- **Kotak 4:** The Leaves (Sari utuh)

Setiap spesifik `className` membawa ukuran kolom `md:col-span-2 md:row-span-2` dll., yang menentukan seberapa besar bidang dominansi foto yang ditempati dalam wadah kotak grid. 

---

## Animasi Inisiatif
Setiap box Bento dijaga dengan nilai `whileInView`, yang berarti bila blok tersebut tidak tampak di layar, tidak ada animasi yang terjadi. Namun pas terlihat (`once: true`), boks tersebut perlahan membesar *scale* 0.95 ke 1 dan tampil dari keredupan. Ditambah jeda pemunculan berangsur (*staggered*) via `delay: i * 0.1`.

## Pemolesan Piktorial
Gambar-gambarnya memiliki efek gradien hitaman di tepi bawah `<div bg-gradient-to-t />` agar teks putih masih bisa terbaca kontras pada ragam objek foto teh.
Ada pula efek *hover* yang menghilangkan mode abu-abu (`grayscale hover:grayscale-0`) dipadu rupa modifikasi zoom `group-hover:scale-105` kala kursor menyentuh blok card Bento.
