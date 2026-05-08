# 📄 `src/app/page.tsx`

## Deskripsi
File ini adalah **halaman utama (homepage)** dari website Tehkalibrasi yang dapat diakses di URL `/`. Halaman ini menggabungkan semua section utama menjadi satu tampilan landing page yang lengkap.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **URL** | `/` (root / halaman utama) |
| **Tipe** | Client Component (`'use client'`) |
| **Peran** | Merakit semua komponen section menjadi satu halaman landing page |

---

## Isi File

```tsx
'use client';

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative min-h-screen bg-black">
        <Preloader />
        <Navbar />
        <SequenceScroll />   {/* Hero scrollytelling */}
        <AboutSection />
        <BentoSection />
        <StatsSection />
        <TestimonialSection />
        <CtaSection />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
```

---

## Urutan Komponen & Fungsinya

```
SmoothScroll         ← Membuat scroll halaman menjadi smooth (Lenis)
└── main (bg-black)
    ├── Preloader         → Loading screen animasi saat halaman pertama dibuka
    ├── Navbar            → Navigasi menu fullscreen
    ├── SequenceScroll    → Hero section: animasi frame-by-frame saat scroll
    ├── AboutSection      → Section "WHO WE ARE" dengan text reveal animasi
    ├── BentoSection      → Grid foto produk (bento style)
    ├── StatsSection      → Angka statistik (42+ gardens, 156 varieties, dst)
    ├── TestimonialSection→ Testimonial pelanggan dengan auto-slide
    ├── CtaSection        → Call-to-action "Join the Calibration"
    └── Footer            → Footer dengan link dan copyright
```

---

## Penjelasan Visual

Ketika user membuka website, urutan tampilan yang dilihat:
1. **Preloader** muncul dulu (loading bar 0–100%)
2. Setelah loading selesai, **Navbar** dan **SequenceScroll** (hero) tampil
3. User scroll ke bawah → animasi frame gambar teh bergerak
4. Lanjut ke **AboutSection** → **BentoSection** → **StatsSection**
5. **TestimonialSection** → berganti otomatis setiap 5 detik
6. **CtaSection** → tombol order
7. **Footer** paling bawah

---

## Relasi dengan File Lain

```
page.tsx
  └── menggunakan → SmoothScroll.tsx
  └── menggunakan → Preloader.tsx
  └── menggunakan → Navbar.tsx
  └── menggunakan → SequenceScroll.tsx
  └── menggunakan → AboutSection.tsx
  └── menggunakan → BentoSection.tsx
  └── menggunakan → StatsSection.tsx
  └── menggunakan → TestimonialSection.tsx
  └── menggunakan → CtaSection.tsx
  └── menggunakan → Footer.tsx
```

---

## Catatan
- Halaman ini menggunakan `'use client'` karena beberapa komponen di dalamnya membutuhkan interaksi browser (scroll event, animasi, dll).
- Background utama adalah `bg-black` (hitam penuh) untuk tema premium dark mode.
