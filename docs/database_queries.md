# Panduan Query Database — Teh Kalibrasi

Dokumen ini berisi kumpulan query SQL yang digunakan atau berguna untuk pengembangan aplikasi Teh Kalibrasi. Database menggunakan **MySQL 8.0+**.

## 1. Window Functions (MySQL 8.0+)

### ROW_NUMBER()
Memberikan nomor urut unik untuk setiap baris.
```sql
-- Memberikan nomor urut pada produk berdasarkan harga termahal
SELECT 
    ROW_NUMBER() OVER (ORDER BY price DESC) AS rank_harga,
    name, 
    price 
FROM products;
```

### RANK() & DENSE_RANK()
Mirip dengan `ROW_NUMBER()`, tapi memberikan nomor yang sama untuk nilai yang sama.
```sql
-- Ranking produk terlaris berdasarkan total kuantitas terjual
SELECT 
    p.name,
    SUM(oi.quantity) as total_terjual,
    DENSE_RANK() OVER (ORDER BY SUM(oi.quantity) DESC) as peringkat
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id;
```

---

## 2. Manajemen Pesanan (Orders)

### Mengambil Detail Pesanan Lengkap
Query untuk mengambil data pesanan beserta item produk di dalamnya.
```sql
SELECT 
    o.id as order_id,
    o.customer_name,
    o.status,
    oi.quantity,
    p.name as product_name,
    (oi.quantity * oi.price) as subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.id = 123;
```

### Update Status Pickup (Sistem Baru)
```sql
-- Mengupdate lokasi pengambilan untuk pesanan tertentu
UPDATE orders 
SET customer_address = 'Toko Cabang Pusat - Jl. Sudirman No. 10', 
    status = 'ready' 
WHERE id = 456;
```

---

## 3. Laporan & Analitik

### Penjualan Harian (7 Hari Terakhir)
```sql
SELECT 
    DATE(created_at) as tanggal,
    COUNT(id) as total_pesanan,
    SUM(total_price) as total_pendapatan
FROM orders
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY tanggal DESC;
```

### Produk Paling Populer (Wishlist)
```sql
SELECT 
    p.name,
    COUNT(w.id) as total_wishlist
FROM products p
JOIN wishlist w ON p.id = w.product_id
GROUP BY p.id
ORDER BY total_wishlist DESC
LIMIT 5;
```

---

## 4. Keamanan & User

### Mencari User dengan Role Tertentu
```sql
SELECT id, name, email FROM users WHERE role = 'admin';
```

### Menghitung Total Belanja per Pelanggan
```sql
SELECT 
    u.name,
    u.email,
    COUNT(o.id) as jumlah_order,
    COALESCE(SUM(o.total_price), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;
```

---

## Tips Query MySQL
*   **LIMIT & OFFSET:** Gunakan untuk pagination (misal: `LIMIT 10 OFFSET 20`).
*   **COALESCE:** Gunakan untuk memberikan nilai default jika data `NULL` (misal: `COALESCE(discount, 0)`).
*   **LIKE:** Gunakan untuk fitur pencarian (misal: `WHERE name LIKE '%Teh%'`).
