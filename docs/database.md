# 🛢️ `src/lib/db.ts` & `Database Connection`

## Deskripsi
Dokumentasi ini menjelaskan bagaimana proyek *Tehkalibrasi* terhubung ke Database **MySQL**, mengelola variabel lingkungan (Environment Variables), dan mengatur fungsi pengeksekusi Query.

---

## 1. Konfigurasi Variabel di `.env.local`

Titik awal dari semua koneksi database berada di file kredensial lokal bernama `.env.local` di folder *root* proyek.

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=prototype_teh
DB_PORT=3306
```
**Catatan Penting:** 
- Kita menggunakan server database MySQL bawaan XAMPP, yang mana secara *default* `DB_USER` adalah `root` dan `DB_PASSWORD` dibiarkan kosong (`""`).
- `DB_DATABASE=prototype_teh` berarti sebelum menjalankan aplikasinya, Anda harus sudah membuat database bernama `prototype_teh` secara manual di **phpMyAdmin** terlebih dahulu.

---

## 2. Penghubung Inti (`src/lib/db.ts`)

Di dalam proyek Next.js kita, file `src/lib/db.ts` bertugas sebagai "kabel colokan" antara backend Node.js dan MySQL. Proyek ini memakai pustaka (library) bernama `mysql2/promise`.

### Di balik layar fungsi `getConnection()`:
```typescript
import mysql from 'mysql2/promise';

export async function getConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'prototype_teh',
      port: parseInt(process.env.DB_PORT || '3306'),
    });
    return connection;
  } catch (error) { ... throw error; }
}
```
- Kode di atas mengekstrak data konfigurasi dari `.env.local` dengan pemanggilan sintaks `process.env`.
- Jika file `.env.local` hilang, ia telah dibekali dengan **fallback** nilai default (contohnya cadangan port `'3306'` dan `'localhost'`).

---

## 3. Eksekutor Murni (`query()`)

Agar kita tidak perlu repot-repot memanggil `getConnection()`, membuka koneksi, dan menutup koneksi setiap saat kita perlu baca/tulis ke database, file ini juga mengekspor pembungkus **Fungsi `query`**.

```typescript
export async function query(sql: string, values?: any[]) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(sql, values);
    return rows;
  } finally {
    // Apapun yang terjadi (berhasil atau rontok/error), 
    // koneksi JAMIN ditutup untuk hindari kebocoran memory
    await connection.end();
  }
}
```

### Cara File API Routes Menggunakan Fungsi Tersebut
Kini perhatikan jika suatu folder rute `app/api/...` ingin mengambil data dari database, ia hanya perlu mengimpor fungsi `query` ini.

**Contoh Kasusnya:**
```typescript
// /src/app/api/products/route.ts
import { query } from '@/lib/db';

export async function GET() {
  const dataProduk = await query("SELECT * FROM products");
  return Response.json(dataProduk);
}
```
Fungsi `await query` akan otomatis:
1. Membuka koneksi `prototype_teh`.
2. Menyetorkan perintah `SELECT * FROM products`.
3. Mengambil datanya ke bentuk Array.
4. Menutup koneksinya secara otomatis (`connection.end()`).
