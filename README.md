# Pegadaian Mayang Mangurai — Simulasi Digital

Aplikasi simulasi mandiri untuk nasabah Pegadaian Cabang Mayang Mangurai, Kota Jambi.

## Fitur
- **Digi-Taksir** — Simulasi gadai KCA, Fleksi, dan Krasida (perhiasan & batangan, multi-item)
- **Cicil Emas** — Tabel angsuran emas Galeri 24 dengan berbagai pilihan margin & DP

## Struktur File
```
├── index.html   ← Halaman utama (struktur HTML)
├── style.css    ← Seluruh tampilan & layout
├── app.js       ← Seluruh logika simulasi
└── README.md
```

## Deploy ke GitHub Pages

1. Buat repository baru di GitHub (misal: `simulasi-pegadaian`)
2. Upload ketiga file: `index.html`, `style.css`, `app.js`
3. Masuk ke **Settings → Pages**
4. Pilih **Source: Deploy from a branch → main → / (root)**
5. Klik **Save** — tunggu 1–2 menit
6. Akses di: `https://<username>.github.io/simulasi-pegadaian/`

> **Catatan:** Tidak memerlukan server atau backend. Semua perhitungan berjalan di browser.

## Update Harga Emas

Buka `app.js`, cari bagian `const hargaEmas = { ... }` dan sesuaikan nilai per denominasi.

---
**Pegadaian Cabang Mayang Mangurai · SOLID DAN JUARA**
