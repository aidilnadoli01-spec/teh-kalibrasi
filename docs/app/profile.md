# 📄 `src/app/profile/page.tsx`

## Deskripsi
File ini adalah **halaman Profile (Dashboard User)**. Halaman ini bersifat *protected* (hanya bisa diakses jika user sudah login). Di sini user dapat melihat informasi profil mereka dan daftar pesanan (order history) yang pernah dilakukan.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **URL** | `/profile` |
| **Tipe** | Client Component (`'use client'`) |
| **Peran** | Menampilkan data user dan riwayat pesanan (orders) |

---

## State & Hooks yang Digunakan

```tsx
const { data: session, status } = useSession(); // Status login dari NextAuth
const router = useRouter();                     // Untuk redirect
const [orders, setOrders] = useState([]);       // Menyimpan daftar pesanan user
const [loading, setLoading] = useState(true);   // Status loading fetching data
```

---

## Alur Kerja (Flow)

### 1. Pengecekan Autentikasi (`useEffect`)
```tsx
useEffect(() => {
  if (status === 'unauthenticated') {
    router.push('/login'); // Jika belum login, tendang ke halaman login
  } else if (status === 'authenticated') {
    fetchOrders(); // Jika sudah login, ambil data pesanan
  }
}, [status, router]);
```

### 2. Pengambilan Data Pesanan (`fetchOrders`)
```tsx
const fetchOrders = async () => {
  try {
    const res = await fetch('/api/orders/user'); // Call API pesanan milik user ini
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};
```

---

## Fitur Utama di Tampilan (UI)

- **Header Profile**: Menampilkan nama user (dari `session?.user?.name`) dan tombol "Sign Out" merah.
- **My Orders Section**:
  - Jika `orders.length === 0`: Menampilkan pesan "You haven't placed any orders yet."
  - Jika ada: Melakukan *mapping* (`orders.map`) untuk menampilkan setiap order dalam bentuk Card.
- **Order Card Detail**:
  - Menampilkan Nomor Order, Tanggal, dan Total Harga.
  - **Badge Status Order**: (pending, processing, shipped, delivered, cancelled) ditandai dengan warna berbeda.
  - **Badge Status Payment**: (unpaid, pending, verified) ditandai dengan warna berbeda.
  - Detail metode pembayaran (payment method) dan alamat pengiriman (address).

---

## Relasi dengan File Lain

```
profile/page.tsx
  └── menggunakan → next-auth/react (useSession, signOut)
  └── memanggil API → /api/orders/user (untuk list pesanan)
  └── memanggil util→ @/lib/currency (formatCurrency)
  └── menggunakan → Navbar.tsx
  └── menggunakan → Footer.tsx
  └── redirect ke   → /login (bila blm login) atau / (setelah signout)
```

---

## Catatan
- Karena ada rendering dinamis berdasarkan status autentikasi, akan ada jeda *loading* sementara saat memeriksa apakah user login atau tidak (`status === 'loading'`), ditangani dengan teks "Loading...".
