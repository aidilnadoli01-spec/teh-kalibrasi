# 📄 `src/app/register/page.tsx`

## Deskripsi
File ini adalah **halaman Registrasi** untuk membuat akun baru. User mengisi nama, email, dan password. Data dikirim ke API `/api/auth/register`, dan jika berhasil user diarahkan ke halaman `/login`.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **URL** | `/register` |
| **Tipe** | Client Component (`'use client'`) |
| **Peran** | Form pendaftaran akun baru |

---

## State yang Digunakan

```tsx
const [formData, setFormData] = useState({
  name: '',       // Nama lengkap user
  email: '',      // Email user
  password: '',   // Password user
});
const [error, setError] = useState('');        // Pesan error
const [loading, setLoading] = useState(false); // Status loading
```

---

## Alur Kerja (Flow)

```
User isi Nama + Email + Password
          ↓
Klik tombol "Register"
          ↓
handleSubmit() dipanggil
          ↓
POST request ke → /api/auth/register
          ↓
Berhasil (res.ok)?  → redirect ke /login
Gagal?              → tampilkan pesan error
```

---

## Penjelasan Fungsi Utama

### `handleSubmit`
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  router.push('/login'); // Setelah daftar, arahkan ke login
};
```
- Mengirim data sebagai JSON ke backend
- Jika API mengembalikan error, pesan error ditampilkan ke user
- Password di sini **belum di-hash di client** — hashing dilakukan di sisi server (`/api/auth/register`)

---

## Tampilan Form

```
┌────────────────────────────┐
│         Register           │  ← Judul (emerald-500)
│                            │
│  Name:     [____________]  │
│  Email:    [____________]  │
│  Password: [____________]  │
│                            │
│  [Error message jika ada]  │  ← text-red-500
│                            │
│  [    Register Button    ] │  ← bg-emerald-500
│                            │
│  Already have account?     │
│  Login here ←link          │
└────────────────────────────┘
```

---

## Relasi dengan File Lain

```
register/page.tsx
  └── memanggil API → /api/auth/register/route.ts
  └── redirect ke   → /login (setelah berhasil daftar)
  └── link ke       → /login
```

---

## Catatan
- Tidak ada validasi panjang password di sisi client (hanya `required`).
- Sebaiknya ditambahkan validasi seperti: minimum 8 karakter, konfirmasi password, dll untuk UX yang lebih baik.
