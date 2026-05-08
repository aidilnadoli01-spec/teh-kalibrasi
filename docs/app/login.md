# 📄 `src/app/login/page.tsx`

## Deskripsi
File ini adalah **halaman Login** yang memungkinkan pengguna masuk ke akun mereka menggunakan email dan password. Setelah berhasil login, user akan diarahkan ke halaman `/profile`.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **URL** | `/login` |
| **Tipe** | Client Component (`'use client'`) |
| **Peran** | Form autentikasi user menggunakan NextAuth credentials provider |

---

## State yang Digunakan

```tsx
const [email, setEmail] = useState('');       // Input email user
const [password, setPassword] = useState(''); // Input password user
const [error, setError] = useState('');       // Pesan error jika login gagal
const [loading, setLoading] = useState(false);// Status loading saat proses login
```

---

## Alur Kerja (Flow)

```
User isi email + password
        ↓
Klik tombol "Login"
        ↓
handleSubmit() dipanggil
        ↓
signIn('credentials', { email, password }) → NextAuth
        ↓
Berhasil?  → redirect ke /profile
Gagal?     → tampilkan pesan error
```

---

## Penjelasan Fungsi Utama

### `handleSubmit`
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  const res = await signIn('credentials', {
    redirect: false,
    email,
    password,
  });

  if (res?.error) {
    setError(res.error);    // Tampilkan error
    setLoading(false);
  } else {
    router.push('/profile'); // Redirect ke profile
    router.refresh();
  }
};
```
- `redirect: false` → agar tidak otomatis redirect, kita handle sendiri
- `router.refresh()` → memaksa Next.js memperbarui data session di halaman baru

---

## Tampilan Form

```
┌────────────────────────────┐
│         Log In             │  ← Judul (emerald-500)
│                            │
│  Email:    [____________]  │
│  Password: [____________]  │
│                            │
│  [Error message jika ada]  │  ← text-red-500
│                            │
│  [      Login Button     ] │  ← bg-emerald-500
│                            │
│  Don't have account?       │
│  Register here ←link       │
└────────────────────────────┘
```

---

## Relasi dengan File Lain

```
login/page.tsx
  └── menggunakan → next-auth/react (signIn)
  └── menggunakan → next/navigation (router)
  └── link ke     → /register
  └── redirect ke → /profile (setelah berhasil)
```

---

## Catatan
- Jika user sudah login dan mengakses `/login`, sebaiknya ditambahkan redirect otomatis ke `/profile` (belum diimplementasi).
- Validasi saat ini hanya dari sisi server (NextAuth). Tidak ada validasi client-side tambahan selain `required` HTML.
