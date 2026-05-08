# 📄 `src/app/track-order/page.tsx`

## Deskripsi
Laman pelacakan pesanan khusus bagi para pelanggan yang ingin mengetahui status pemesanan mereka atau mengunggah bukti pembayaran via transfer bank.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **URL** | `/track-order` |
| **Tipe** | Client Component (`'use client'`) |
| **Fitur** | Pencarian Pesanan, Indikator Status, Bukti Bayar (*Upload Image*) |

---

## Alur Kerja Pelacakan

### 1. Sistem Autentikasi Layar Kaca
Mulai revisi terbaru, **halaman ini bersifat privat**. Saat seorang anonim mencoba masuk ke tautan `/track-order`, komponen akan bereaksi menggunakan `useSession()` dari *NextAuth* dan secara otomatis mengalihkannya kembali ke halaman `/login`.

### 2. Algoritma Pencarian Ganda
Terdapat dua format valid untuk pencarian data:
- **Search by Order ID:** Menggunakan angka (*ID Integer* unik dari tabel `orders`).
- **Search by Email:** Menggunakan teks email yang didaftarkan sewaktu proses *checkout*.
  
Bila tidak cocok atau status respon backend `404 Not Found`, kolom pesan eror beraksen merah akan muncul.

### 3. Detail Instruksi & Upload Bukti Pembayaran
Bila pelanggan memilih metode "Bank Transfer" (dan belum berstatus *Verified* dari admin), maka antarmuka akan memunculkan:
1. Panel **Bank Details**: Merupakan pedoman instruksi dari rekening siapa uang harus dikirim (mencantumkan Nama Bank, Pemilik, dan Nomor Rekening jika ada data spesifik dari pesanan).
2. Panel **File Upload**: Tombol *drag & drop* atau tekan berbingkai *dashed emerald* yang memungkinkan pengguna menyetor file foto PNG/JPG. File diunggah secara fisik melalui *API endpoint* `/api/payment-proof`, yang lantas memperbarui URL ke dalam `orders` pada kolom `payment_proof_url`.

---

## Integrasi Desain Responsif
UI telah dikompilasi secara responsif ke semua ranah (Telepon genggam, Tablet, dan Komputer Desktop). Hal tersebut diraih lewat utilitas TailwindCSS seperti:
- Grid asimetris (`grid-cols-1 sm:grid-cols-2`)
- Tumpukan form berstruktur (`flex-col md:flex-row`)
- Spasi *padding* toleran terhadap pinggiran layar perangkat genggam.
