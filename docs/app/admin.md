# 📄 `src/app/admin/page.tsx`

## Deskripsi
Halaman ini adalah **Portal Dashboard Admin** terpadu. Tempat bagi administrator toko untuk mengelola semua aspek operasional, mulai dari pesanan, katalog produk, daftar kategori, manajemen pelanggan pengguna, hingga pemantauan analitik penjualan toko. 

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **URL** | `/admin` |
| **Tipe** | Client Component (`'use client'`) |
| **Status** | *Private Route* terisolasi buatan sendiri |

---

## Mekanisme Login Internal
Tidak menggunakan sistem NextAuth utama yang ada di situs pengunjung. Melainkan ia memeriksa otoritas via state React lokal (Hardcoded / Demo Mode).
- **Username:** `admin`
- **Password:** `admin123`

```tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (username === 'admin' && password === 'admin123') {
    setIsLoggedIn(true);
    // ... lalu fetch semua data (orders, products, dll)
  }
}
```

---

## Navigasi / *Tabs*

Pusat Dashboard dikendalikan oleh satu state tab `activeTab`. Ada 5 panel utama:

### 1. Panel `orders` (Pesanan)
- **Tampilan Utama:** Memuat List tabel dari semua pelanggan yang order.
- **Fitur Kunci:**
  - *Export CSV*: Mampu mengunduh rekapan pesanan menajadi file Microsoft Excel/CSV (`exportOrdersCSV`).
  - *Edit Status Pesanan*: Mangatur orderan menjadi "Pending", "Processing", "Shipped", "Delivered".
  - *Edit Status Bayar*: Mengatur jadi "Verified" atau "Unpaid".
  - *Cek Bukti Bayar*: Tombol pop up gambar jika pelanggan membayarnya lewat Bank Transfer mandiri.
  - *Hapus*: Opsi untuk Delete / hapus orderan masuk.

#### Validasi Input Bank Details
Saat admin mengisi informasi rekening untuk pesanan dengan metode *Bank Transfer*, input sudah dilengkapi batasan ketat:

| Field | Aturan |
|-------|--------|
| **Nama Bank** | Hanya huruf, spasi & titik — maks 30 karakter |
| **Nama Pemilik Rekening** | Hanya huruf & spasi — maks 50 karakter |
| **Nomor Rekening** | Hanya angka — maks 20 digit, keyboard numerik |

Setiap field menampilkan **helper text dinamis** (counter karakter & keterangan jenis input) agar admin tidak salah isi data rekening.

### 2. Panel `products` (Produk)
- **Fungsi:** Mengatur daftar barang Teh yang dijual.
- **Aksi CRUD:**
  - Pembuatan produk baru.
  - Memasukkan foto (terintegrasi API Route `/api/upload` memanipulasi *file form data*).
  - Menyambungkannya ke daftar "Kategori" tertentu.
  - Menghapus katalog yang sudah tak terpakai.

### 3. Panel `categories` (Kategori)
- **Fungsi:** Menambah struktur kategori baru (merah, hijau, oolong, dll) agar barang jualan lebih rapi dikelompokkan oleh database.
  
### 4. Panel `customers`
- **Fungsi:** Secara gampang menampilkan rekapan nama dan *email* dari seluruh user pelanggan yang telah membuat akun pada di muka website.

### 5. Panel `analytics` (Grafik Keuangan)
- **Fungsi:** Meng-import komponen visual `SalesChart.tsx` untuk menampilkan grafik Recharts garis dan batang terkait kondisi pendapatan, rataan pemesanan, produk idaman yang marak diburu dalam jangka 30 hari belakangan.

---

## Desain Responsif (Mobile & Tablet)
Mulai dari tab menu yang dirancang menggunakan *scroll horizontal* bebas gangguan, sampai dengan panel form yang bertumpuk dengan cerdas (statis di layar kecil, *sticky* di layar besar), Admin Dashboard dirancang untuk kompatibilitas multi-perangkat. Hal ini memastikan administrator toko tetap dapat mengawasi operasional harian melalui *smartphone* kapanpun dan di manapun.

---

## Pemanggilan Data
Semua data di dalam tab ini bersifat interaktif murni (*Client-Side Data Fetching*). Saat user login, antarmuka langsung menyapu bersih data dari database lewat titik API independen:
- `fetch('/api/orders')`
- `fetch('/api/products')`
- `fetch('/api/categories')`
- `fetch('/api/users')` 

Data-data ini dimasukkan ke array penampung (`State Array Type`) yang mengokohkan reaktivitas halaman admin secara utuh di satu layar (Single Page Application UX).
