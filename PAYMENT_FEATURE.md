# Order System dengan Payment Management - Setup Guide

## Features Added

### 1. ✅ Payment Methods di Checkout
- Bank Transfer
- E-Wallet (GCash, Dana, OVO)
- Cash on Delivery (COD)

Pembeli bisa memilih metode pembayaran saat checkout.

### 2. ✅ Order Tracking Page (`/track-order`)
Pembeli bisa melacak order mereka dengan:
- Search by Order ID
- Search by Email Address
- Lihat status order real-time
- Lihat payment status
- Upload bukti pembayaran

### 3. ✅ Payment Proof Upload
- Pembeli bisa upload bukti pembayaran (gambar)
- Disimpan di `/public/payment-proofs/`
- Max 5MB, format: JPEG, PNG, WebP, GIF

### 4. ✅ Admin Features
- Lihat payment proof dari pembeli
- Update payment status (Unpaid, Pending, Verified)
- View seluruh informasi pembayaran di order detail

### 5. ✅ Auto-Reset Order ID
Setelah order dihapus, ID akan dimulai dari awal.

---

## Database Updates

Jalankan SQL berikut untuk update database:

```sql
-- Update orders table dengan payment fields
ALTER TABLE orders ADD COLUMN payment_method ENUM('bank_transfer', 'ewallet', 'cod') NOT NULL DEFAULT 'bank_transfer';
ALTER TABLE orders ADD COLUMN payment_status ENUM('unpaid', 'pending', 'verified') DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN payment_proof_url VARCHAR(500);
```

Atau gunakan file `database.sql` yang sudah diupdate.

---

## API Endpoints Baru

### 1. Upload Payment Proof
```
POST /api/payment-proof
- Multipart form dengan file
- Param: orderId
- Return: imagePath
```

### 2. Update Payment Proof di Order
```
PUT /api/orders/{id}/payment-proof
- Body: { paymentProofUrl: "..." }
```

### 3. Search Order (untuk track-order page)
```
GET /api/orders?search={value}&searchType={id|email}
- searchType: 'id' atau 'email'
- Return: Order object dengan full details
```

### 4. Update Payment Status (dari admin)
```
PUT /api/orders/{id}
- Body: { payment_status: "unpaid|pending|verified" }
```

---

## Folder Structure

```
public/
├── products/           (existing - product images)
└── payment-proofs/     (NEW - payment proof images)

src/app/
├── track-order/        (NEW - pembeli tracking page)
├── api/
│   ├── payment-proof/  (NEW - payment proof upload API)
│   └── orders/
│       └── [id]/
│           └── payment-proof/ (NEW - update payment proof)
```

---

## Cara Menggunakan

### Untuk Pembeli:

1. **Checkout Order**
   - Pilih payment method
   - Input customer details
   - Place order
   - Dapat order ID

2. **Track Order**
   - Buka `/track-order`
   - Search by Order ID atau Email
   - Lihat order status
   - Upload bukti pembayaran (jika diperlukan)

### Untuk Admin:

1. **Login** ke `/admin` (admin/admin123)
2. **Orders Tab**
   - Lihat daftar semua orders
   - Click order untuk detail
   - Update order status
   - **NEW:** Update payment status (Unpaid, Pending, Verified)
   - **NEW:** Lihat payment proof dari pembeli
   - Delete order

3. **Payment Verification**
   - Klik order yang payment_status = "pending"
   - Lihat bukti pembayaran
   - Klik "Verified" untuk approve pembayaran
   - Order status bisa di-update ke "Processing"

---

## Environment Variables

Tidak ada env baru yang diperlukan. Gunakan yang sudah ada di `.env.local`:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_DATABASE=prototype_teh
DB_PORT=3306
NODE_ENV=development
```

---

## Testing Checklist

- [ ] Checkout dengan 3 payment methods berbeda
- [ ] Search order by ID
- [ ] Search order by Email
- [ ] Upload payment proof di track-order page
- [ ] Admin bisa lihat payment proof
- [ ] Admin bisa update payment status
- [ ] Order tracking page menampilkan status real-time
- [ ] Delete order tidak error

---

## Notes

- Order ID sekarang dimulai dari awal setelah dihapus (auto-increment reset)
- Payment proof hanya perlu untuk Bank Transfer dan E-Wallet
- COD tidak perlu upload bukti pembayaran
- Admin dapat lihat semua bukti pembayaran di order detail
- Pembeli bisa update bukti pembayaran berkali-kali sebelum admin verify
