# 📄 `src/components/SalesChart.tsx`

## Deskripsi
Sebuah dasbor analitik modular khusus Admin yang menampilkan ragam wujud bagan (Graik Chart) perihal kesehatan moneter / konversi produk. Penampil utama pada Dashboard Admin.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Pustaka Vektor** | [Recharts](https://recharts.org/) |
| **Peran Utama** | Fetches API & Menampakkan Visual Data |

---

## Alur Data
Ketika komponen dilahirkan (`useEffect`), ia me-*trigger* eksekusi fungsi `fetchSalesData()` yang menjilat rute internal `fetch('/api/sales')`. Lantas membungkus balasan JSON-nya dalam wadah `useState (data)`. Selagi tunggu di-*loader* tampil info "Loading sales data...".

Struktur Data ditangai mencakup:
1. `salesData` = Detail deretan jumlah total omset dan frekuensi pesanan (Harian)
2. `metrics` = Rangkuman Omset kotor, Rata-rata per-Order, Total Pesanan
3. `paymentBreakdown` = Statistik bayaran
4. `topProducts` = Tipe teh yang laku

---

## Variasi Chart yang Dibangun (Recharts)

1. **Dashboard Kartu Matrix (Atas):** 4 kotak hijau yang menunjukkan Total Pendapatan, Jumlah Order, Kuota Pelanggan Unik, nilai Keranjang.
2. **<LineChart> (Grafik Garis):** Menggambar riwayat fluktuasi rezeki dan volum pengiriman selama kurun 30 Hari dengan Sumbu-Y berganda (kiri: nominal uang hijau, Kanan: batas count biru).
3. **<PieChart> (Grafik Bulat Kue):** Representatif Pie berwarna peredaran persentase Metode / Status Bayar Pelanggan (Verifiied/Pending).
4. **<BarChart> (Batang Lurus):** Diagram Bar mendatar yang mengerucut memaradekan klasemen "TOP 5 Produk Terlaris".

---

## Komponen Tabel Ekstra
Bukan cuma chart saja, melainkan ujung paling penutup merender sebuah tabel tabular murni `<table className="w-full text-white">`. Terdapat persentase rinci penghitungan di sisi lajur kolomnya sendiri, `(payment.count / data.metrics.total_orders) * 100`.

## Catatan
- Sangat padat interaksi pergerakan data. Ditambah `ResponsiveContainer` agar semua diagram menyesuaikan luas panjang bidang layar administrator secara elastis.
