# 📄 `src/components/Magnetic.tsx`

## Deskripsi
Komponen cerdas berupa **Wrapper** untuk menghidupkan sifat "magnetis" pada elemen di dalamnya (seperti tombol). Apabila di-hover kursor, elemen anak (children) akan seperti *ketarik* mendekat secara ringan ke arah titik di mana kursor berada (terpasang fungsi 'fisika' pegas/spring).

---

## Fungsi Utama

| Hal | Keterangan |
|-----|------------|
| **Tipe** | Client Component (`'use client'`) |
| **Peran** | *Micro-interaction* Interaktif (biasanya disisipkan membalut sebuah Button) |

---

## Logic Internal
Menangkap `onMouseMove` untuk mencari tengah koordinat obyek dan digeser (dipengaruhi pengali *0.3*):
```tsx
const middleX = clientX - (left + width / 2);
const middleY = clientY - (top + height / 2);
setPosition({ x: middleX * 0.3, y: middleY * 0.3 });
```
Serta ada pemicu buang (Reset) pada saat `onMouseLeave`, sehingga elemennya meloncat balik secara natural.

Dan pada pembungkus luarnya (`<motion.div>`) diterapkan sifat fisik:
`transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}`

---

## Ciri
- Sering dikombinasikan dengan `<motion.button>` untuk menambah dimensi fisik dari tombol CTA (terdapat pada `CtaSection.tsx` dan bagian akhir rentetan `SequenceScroll.tsx`).
