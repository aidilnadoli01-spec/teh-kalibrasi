# 📄 `src/components/TestimonialSection.tsx`

## Deskripsi
Komponen seksi rotasi ulasan / testimoni pembeli. Memiliki cara kerja tayangan *Slider Otomatis* layaknya *Carousel* sederhana dengan aksen kutipan yang khas premium.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Manajemen Rotasi** | `setInterval` via `useEffect` berselimut `AnimatePresence` |

---

## Parameter Mekanik

1. **Autoplay:**
   Terdapat perhitungan interval per 5 detik (5000ms). Komponen secara berkala mensirkulasikian indeks parameter aktif yang kemudian mengubah teks array ulasan yang dilihat.
   
2. **Animasi Transisi Teks:**
   Menentukan `<AnimatePresence mode="wait">` yakni perintah bagi komponen ulasan lama agar "Pergi hingga tuntas" (`exit={{ y: -20, opacity: 0 }}`) terlebih dahulu sedia durasi 0.8s, sebelum mendalangi teks yang baru "Terjun muncul ke ranah layar" (`initial...`). Hal ini meminimalkan kliping visual dan menjamin ritme gilir memukau.

3. **Tombol Navigasi Manual / Indicators:**
   Goresan palang bundar bawah layar. Jika `index === i`, palangnya akan mekar lebih panjang `w-24` menandakan ia titik poin aktif, sedangkan pelanting yang pasif meliut kecil pucat (tombol *dots* slider memanjang ala *pill* indikator). Pengguna dapat menge-kliknya untuk melompat testimoni secara manual.

---

## Sentuhan Seni CSS
Desainnya diletakkan dengan kutipan raksasa di tengahan dan hiasan gradasi cahaya Emerald buatan pada punggung layar `<div... blur-[120px] />` seperti memantulkan sorot lampu panggung.
