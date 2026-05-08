# 📱 Fitur WhatsApp Click-to-Chat (Admin Dashboard)

## Deskripsi
Dokumentasi ini menjelaskan berjalannya sistem komunikasi via WhatsApp antara Admin *Tehkalibrasi* dan pelanggan. Pembuatan fitur ini sangat difokuskan untuk menjaga keamanan nomor WhatsApp Toko (menghindari blokir/Banned oleh Meta) sembari tetap memberikan pengalaman berbelanja profesional.

---

## 1. Konsep Fitur & Keamanan
Awalnya, prototipe *Tehkalibrasi* direncanakan menggunakan pengiriman pesan *Background API* (Fonnte/WhatsApp Web JS). Namun, pengiriman pesan massal menggunakan *"Bot"* atau API tak resmi secara langsung ke nomor-nomor baru sangat rentan terkena **Banned** permanen oleh sistem *spam* WhatsApp Meta.

Oleh karena itu, solusinya **diubah menjadi "Manual Click-to-Chat" khusus untuk layar Admin**.

### Cara Kerja:
1. Pelanggan Checkout melalui web tanpa ada trigger script WA berbahaya.
2. Admin mengecek menu **Orders** di halaman Admin Dashboard.
3. Saat diklik pesanan pelanggan, Nomor HP (Phone) pelanggan tersebut akan muncul sebagai Tombol WhatsApp berwarna Hijau yang bisa diklik.
4. Ketika diklik, Sistem akan langsung membuka Aplikasi WhatsApp Admin, mengarahkan langsung ke kontak si pelanggan beserta **Draft Pesan Profesional yang terisi otomatis**.

---

## 2. Struktur Kode (Frontend Admin)
Fitur klik WhatsApp ditanam pada file `src/app/admin/page.tsx`, di dalam kotak pop-up Detail Order.

### a. Konversi Kode Negara (62)
```tsx
href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '').replace(/^0/, '62')}`} 
```
Script regex `.replace(/\D/g, '')` berguna untuk menghapus karakter selain angka (seperti spasi atau tanda strip `-`). Kemudian `.replace(/^0/, '62')` mengubah angka awalan `0` nomor lokal Indonesia menjadi konvensi internasioal `62` yang dibutuhkan oleh protokol `wa.me`.

### b. Format Template Pesan (Template Literals)
Di dalam URL param `?text=...`, pesannya disisipkan menggunakan pola `encodeURIComponent` agar karakter spasi, enter `\n`, dan simbol menjadi tipe data URL yang valid.

**Template yang ditarik secara dinamis:**
- Nama Pembeli: `selectedOrder.customer_name`
- Nomor Order / ID: `selectedOrder.id`
- Total Harga Beli: `{formatCurrency(parseFloat(String(selectedOrder.total_price)))}`
- Metode Pembayaran: `selectedOrder.payment_method.toUpperCase()`

**Contoh tampilan URL komplit:**
```tsx
href={`https://wa.me/62... ?text=${encodeURIComponent(`Halo Kak ${selectedOrder.customer_name}! 👋\n\nTerima kasih telah berbelanja di *Tehkalibrasi*.\nIni adalah pesan dari Admin untuk konfirmasi pesanan Anda dengan Order ID: *#${selectedOrder.id}*.\n\nTotal tagihan: *${formatCurrency(parseFloat(String(selectedOrder.total_price)))}*.\nMetode Pembayaran: *${selectedOrder.payment_method.toUpperCase()}*\n\nJika ada pertanyaan terkait pengiriman atau pembayaran pesanan, silakan balas pesan ini ya Kak. Terima kasih! ☕`)}`}
```

---

## 3. Keunggulan Fitur
1. **100% Anti-Banned**: Dikarenakan Admin menggunakan app legal resmi WhatsApp di perangkatnya sendiri (Browser wa.me / App WA Desktop) dengan klik manual, aktivitas ini persis seperti Manusia asli, sehingga bebas blokir.
2. **Kustomisasi Final**: Karena format yang terlempar ke layar HP/WhatsApp Desktop sifatnya baru "Tertulis (Draft)", Admin masih memiliki kesempatan mengedit / menambahkan resi secara manual di kolom ketikan WA sebelum benar-benar memencet lambang "Kirim" kertas pesawat di WA.
3. **Efisiensi Waktu**: Admin tidak perlu mengetik "Halo, tagihanmu sekian rupiah", karena sudah dikumpul dari Database dan terisi secara programmatis seketika admin memencet tombol hubungi.
