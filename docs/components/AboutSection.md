# 📄 `src/components/AboutSection.tsx`

## Deskripsi
Sebuah komponen narasi statik ("WHO WE ARE") dengan efek interaktif tipografi. Memiliki kalimat yang diarsir kegelapan dan mulai mencerahkan diri kata per kata ketika layar di-scroll melewatinya.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Lokasi** | Section Landing Page (setelah purna layar hero utama) |
| **Peran** | Elemen tipografi interaktif |

---

## Arsitektur Penulis (Logika)
Dipecah ke dalam abstraksi komponen-dalam-komponen:

### `<TextReveal>` *wrapper*:
Tugasnya mencacah setiap huruf/kata yang dikirim (berupa prop *string text*) dipisah-pisah lewat perantara `.split(" ")`.
Lalu nilai letak posisi gulir `scrollYProgress` dimonitor dengan hook khusus menarget titik *"start 0.9"* menuju *"start 0.25"*.

### `<Word>` *unit*:
Setiap kata terbungkus komponen terkecil bernama `<Word>`. Komponen ini bertugas menyelaraskan letak fraksi index dirinya (0.01 hingga 1.0) dibandingkan dengan inputan letak guliran. 
Kata-kata awalnya disetel dengan *opacity 0.1* (gelap) dan mendangak bertahap menjadi 1 (cerah putih) seiring rasio *scroll* melintas.

---

## Tampilan Visual
- Sub-Judul sangat kecil *"WHO WE ARE"* dengan animasi naik perlahahn di tengah atas.
- Teks super renggang font estetik (Outfit) mencuat layaknya tulisan film berjalan. Teks disetel rata lebar `max-w-5xl mx-auto`.
