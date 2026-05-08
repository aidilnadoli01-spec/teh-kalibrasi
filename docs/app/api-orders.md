# 📄 `src/app/api/orders/route.ts`

## Deskripsi
File penghubung (API Endpoint) ini bertanggung jawab atas semua operasi baca-tulis pemesanan. Baik untuk pelacakan *track-order* pelanggan hingga proses rendering orderan di tabel *Admin Dashboard*.

---

## Logika HTTP Methods

### `GET` (Membaca Data Pesanan)
Memiliki dua fungsi bergantung ada atau tidaknya *query params*:
1. **Pencarian Spesifik:** Jika memuat parameter URL `?search={value}&searchType={type}`, backend akan menangkapnya untuk melacak ID atau email yang terdaftar di pesanan. Sistem juga memuat rincian keranjang (tabel *order_items*) menggunakan klausa `JOIN` MySQL.
2. **Pengambilan Massal (Khusus Admin):** Jika tanpa *query params*, ia mengartikan request tersebut sebagai data utuh, mengambil seluruh pesanan yang ada untuk dikembalikan dalam bentuk Array ke antarmuka Dashboard.

### `POST` (Membuat Pesanan)
Memecah Payload JSON yang terkirim dari *Checkout Modal*.
- **Keamanan (Otorisasi Sesi):** Diperbarui untuk wajib mendeteksi `getServerSession(authOptions)`. Bila klien yang melempar objek bukan *user* autentik, API menolak pesanan (`401 Unauthorized`).
- **Transaksi Basis Data:**
  - `INSERT` data profil & nominal tagihan ke tabel utama `orders`.
  - Berulang lewat *looping* untuk melakukan `INSERT` terhadap barisan teh ke dalam tabel anak `order_items`.
  - Memotong/mengurangi *(reduce)* stok komoditas teh dari tabel `products` sesuai `quantity` pesanan.
- **Notifikasi Nodemailer:** Menggunakan metode asinkron *(non-blocking)* untuk mengirim *email konfirmasi* resmi ke alamat surel pembeli bersangkutan tanpa menunggu dan memberatkan waktu muat *client*.

---
