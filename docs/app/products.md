# 📄 `src/app/products/page.tsx`

## Deskripsi
Halaman ini adalah katalog utama tempat pelanggan dapat melihat seluruh produk teh yang ditawarkan, menambahkannya ke dalam keranjang belanja (*cart*), hingga melakukan *checkout* pesanan secara langsung.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **URL** | `/products` |
| **Tipe** | Client Component (`'use client'`) |
| **Fitur** | Katalog Produk, Filter Kategori, Pencarian, Keranjang (Cart), *Checkout*, Integrasi *Wishlist* |

---

## Logika & Alur Belanja

### 1. Sistem Autentikasi Pemesanan (Wajib Login)
Setiap interaksi krusial kini diamankan oleh proteksi sesi dari `useSession()`. Pengunjung dapat melihat-lihat produk secara bebas, namun **diwajibkan untuk login** pada saat:
- Mengeklik tombol **Add to Cart**.
- Mengeklik tombol **Checkout**.
- Mengeklik tombol hati (♥) untuk menambahkan item ke **Wishlist**.

Jika pengguna mencoba melakukan hal tersebut tanpa login, akan muncul modal popup animasi (dibangun menggunakan **Framer Motion**) berdesain *glassmorphism* modern yang meminta mereka untuk *Login* atau membatalkan aksi.

### 2. Manajemen Keranjang (Cart State)
Keranjang belanja diatur menggunakan state lokal (Array objek). Di sisi kanan antarmuka, *sidebar* keranjang secara reaktif merangkum:
- Daftar item yang dipilih.
- Modifikasi angka kuantitas (mengubah input atau menekan tombol silang merah).
- Kalkulasi Harga Total (Subtotal + Total).

### 3. Modal Checkout
Bila pelanggan mengklik tombol "Checkout", antarmuka utama meredup digantikan form interaktif. Data terisi otomatis jika pengguna telah masuk (seperti nama & email). 

#### Validasi Input Form
Semua field checkout memiliki batasan (constraint) yang ketat:

| Field | Batasan |
|-------|---------|
| **Nama Lengkap** | Hanya huruf, spasi, apostrof & titik — maks 50 karakter |
| **Email** | Format email valid (validasi HTML `type="email"`) |
| **Nomor Telepon** | Hanya angka dan `+` — maks 15 digit, keyboard numerik |
| **Alamat** | Teks bebas |

Validasi diterapkan langsung saat mengetik (`onChange`) dengan regex filtering, sehingga karakter yang tidak sesuai **tidak akan bisa diketik sama sekali**. Terdapat juga helper text dinamis yang menampilkan jumlah karakter saat ini vs batas maksimum.

- **Kode Promo**: Terdapat logika simulasi kode promo yang akan memanggil API `/api/promo` guna mengurangi nominal total akhir.
- Terdapat pilihan pembayaran: *Bank Transfer*, *E-Wallet*, dan *Cash on Delivery (COD)*.

Bila semuanya tervalidasi dan order berhasil tersimpan ke sistem database (melalui POST `api/orders`), pop up pemberitahuan sukses yang mencantumkan **Order ID** akan muncul dan mengarahkan klien ke layar pelacakan ("Track Order").
