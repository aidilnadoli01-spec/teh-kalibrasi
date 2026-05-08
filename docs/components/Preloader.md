# 📄 `src/components/Preloader.tsx`

## Deskripsi
Komponen **Preloader** memberikan layar "Loading" bohongan bergaya estetik yang muncul menutupi halaman saat website pertama kali memuat. Preloader ini akan menghitung progres pemuatan (0% ke 100%) sebelum menghilang ke atas untuk menampilkan isi asli website.

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Peran** | Masking (penutup) sebelum website siap dan elemen *wow-factor* pertama kali masuk |

---

## Logic / State
```tsx
const [progress, setProgress] = useState(0); // Progres rentang 0-100
const [isDone, setIsDone] = useState(false);  // State pengecek apakah sudah purna loading
```
Digunakan sebuah `setInterval` dalam `useEffect` yang akan menaikkan `progress` dengan angka *random* 1 sampai 5. Setelah `progress` menembus `100`, ia akan berhenti dan memberi jeda sebentar sebelum mengubah status `isDone` ke true.

---

## Animasi
Bergantung sepenuhnya pada `framer-motion`:
- Dibungkus `<AnimatePresence>` sehingga bila `!isDone`, komponen masih muncul; lalu apabila `isDone` bernilai *true*, komponennya akan **ditarik ke atas** secara berangsur.
- `exit={{ y: '-100%' }}` bertugas menarik seluruh wrapper ke atas.
- Terdapat bar progres dan tulisan *percentase* yang bergerak searah dinamis.
- Slogan kecil "Fine tea takes time" dimunculkan paling bawah.

---

## Catatan
- Loading ini tidak diikat pada progres *network fetch* sesungguhnya, melainkan murni efek *dummy* berdasar batas waktu buatan untuk menimbulkan pengalaman sinematik.
