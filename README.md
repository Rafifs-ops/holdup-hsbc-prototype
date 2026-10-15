# HoldUp!

High-fidelity, interactive web prototype of **HoldUp!** — fitur pengelolaan saldo yang
membantu pengguna berpikir sejenak sebelum melakukan pembelian. HoldUp! dirancang sebagai
fitur tambahan di dalam aplikasi mobile banking, bukan aplikasi budgeting terpisah.

Prinsip produknya: pengguna bebas memakai uangnya. Aplikasi hanya menghitung **Saldo Aman**
dan memberi jeda singkat ketika sebuah transaksi berpotensi melewatinya. Tidak ada transaksi
yang diblokir.

## Menjalankan

```sh
npm install
npm run dev      # development server
npm run build    # production build
npm run preview  # serve hasil build
```

Stack: Vue 3 (`<script setup>`), Vite, Vue Router, Pinia, dan **Dexie.js** (IndexedDB).
Tidak ada UI framework, icon library, atau chart library — ikon memakai inline SVG
(`src/components/AppIcon.vue`). Prototipe berjalan sepenuhnya lokal: tanpa backend, tanpa
koneksi rekening bank.

## Alur utama

| Halaman | Rute | Isi |
| --- | --- | --- |
| Onboarding | `/mulai` | Isi saldo simulasi sendiri atau pakai data demo |
| Home | `/` | Saldo Aman sebagai hero, ringkasan total saldo, empat pintasan, ringkasan tabungan, tiga aktivitas terakhir |
| Detail HoldUp! | `/holdup` | Rumus Saldo Aman, jatah harian, cara kerja |
| Kantong & Saldo | `/kantong` | Perhitungan Saldo Aman + tombol menuju sheet “Atur Saldo” |
| Misi Tabungan | `/misi` | Buat misi (3 isian), tambah tabungan, lihat progres |
| Aktivitas | `/aktivitas` | Semua transaksi dengan filter Pengeluaran / Pemasukan / Alokasi |
| Menu | `/menu` | Profil, layanan, Atur Saldo, reset data demo dengan konfirmasi |
| Top Up | `/topup` | Mencatat pemasukan agar perubahan saldo bisa ditelusuri |
| Placeholder | `/transfer`, `/bayar`, `/layanan` | Halaman dummy dengan layout konsisten |

**Simulasi pengeluaran** dimulai dari pintasan “Catat pengeluaran”, halaman HoldUp!, atau menu.
Kalau nominal melewati Saldo Aman, muncul sheet jeda berisi nominal pembelian, Saldo Aman saat
ini, dan Saldo Aman setelah pembelian — dengan dua pilihan: “Saya paham, lanjutkan” atau
“Batalkan”. Membatalkan tidak mengubah satu pun data.

## Logika finansial

Satu sumber perhitungan di `src/stores/finance.js`; Saldo Aman **selalu dihitung**, tidak
pernah disimpan sebagai angka terpisah:

```
safeBalance    = totalBalance − bill − savings − emergency − savingsTarget
remainingDays  = jumlah hari sisa bulan berjalan (termasuk hari ini)
dailyAllowance = floor(max(safeBalance, 0) / remainingDays)
```

- **Target Tabungan (`savingsTarget`)** adalah nominal sisihan tambahan bulan ini dan
  **berbeda** dari target jangka panjang sebuah misi. Target misi tidak mengurangi saldo
  sekaligus; hanya dana yang benar-benar dipindahkan yang mengurangi Saldo Aman.
- **Dana misi tidak dihitung dua kali.** Setiap dana masuk ke sebuah misi berpindah dari Saldo
  Aman ke kantong Tabungan dalam satu transaksi Dexie, dan kantong itulah yang dikurangi pada
  formula. Sisa dana kantong yang belum ditugaskan ke misi ditampilkan sebagai “dana bebas”.
- Alokasi yang membuat Saldo Aman negatif tetap boleh disimpan, hanya diberi peringatan.
  Jatah harian mengikuti menjadi Rp0, dan pengeluaran tidak pernah diblokir.

Data demo: total Rp8.500.000, Tagihan Rp2.000.000, Tabungan Rp1.500.000, Dana Darurat
Rp1.000.000, Target Tabungan Rp500.000 → **Saldo Aman Rp3.500.000**, plus satu misi
“Laptop Baru” (target Rp12.000.000, progres Rp1.200.000) dan contoh transaksi.

## Penyimpanan (Dexie + IndexedDB)

`src/db/index.js` mendefinisikan satu database (`holdup`) dengan empat tabel:

| Tabel | Isi |
| --- | --- |
| `settings` | baris `main` = total saldo, Target Tabungan, nama, status onboarding; baris `meta` = bookkeeping migrasi |
| `pockets` | alokasi `bill` / `savings` / `emergency` |
| `missions` | misi tabungan (nama, target, saved, status, createdAt) |
| `transactions` | riwayat lengkap: pengeluaran, pemasukan, dan perubahan alokasi |

Aturan yang dipegang:

1. **Semua mutasi uang lewat `src/services/financeService.js`.** Operasi yang menyentuh lebih
   dari satu tabel dibungkus `db.transaction('rw', ...)` sehingga saldo, kantong, dan riwayat
   tidak pernah terpisah saat terjadi error.
2. **Inisialisasi sebelum membaca.** `main.js` menunggu `finance.init()` dan `missions.init()`
   selesai sebelum router dipasang dan aplikasi di-mount. Saat gagal, App.vue menampilkan
   status error + tombol “Coba lagi”; saat menunggu, muncul loading state.
3. **Data awal tidak menimpa saldo pengguna.** Seed demo hanya ditulis ketika pengguna memilih
   “Gunakan data demo”, membuka onboarding pertama kali, atau menekan reset.
4. **Migrasi satu kali** dari versi `localStorage`: `migrateLegacyData()` membaca
   `holdup.finance.v1` dan `holdup.missions.v1`, menuliskannya ke IndexedDB, lalu menghapus
   kunci lama. Flag `meta.legacyMigrated` mencegah impor ganda.

## Cara menguji

1. `npm run build` lalu `npm run preview`.
2. Buka aplikasi pada profil browser baru → onboarding muncul. Pilih **Gunakan data demo**
   atau isi saldo sendiri.
3. **Persistensi:** ubah saldo lewat “Atur Saldo”, catat pengeluaran, lalu refresh halaman —
   angka terakhir harus tetap sama (IndexedDB).
4. **Formula:** “Lihat rincian” menampilkan Total Saldo − Tagihan − Tabungan − Dana Darurat −
   Target Tabungan = Saldo Aman; coba contoh Rp10.000.000 − 2.000.000 − 1.500.000 − 1.000.000 −
   500.000 → Rp5.000.000.
5. **Jeda HoldUp!:** catat pengeluaran lebih besar dari Saldo Aman → sheet jeda muncul.
   “Batalkan” tidak mengubah saldo maupun riwayat; “Saya paham, lanjutkan” menyimpan transaksi
   dan memperbarui dashboard.
6. **Misi tanpa hitung ganda:** danai sebuah misi, lalu pastikan Saldo Aman turun tepat sebesar
   dana yang dipindahkan dan total saldo tidak berubah.
7. **Reset:** Menu → “Reset data demo” menampilkan konfirmasi lebih dulu.

## Struktur

```
src/
├── components/   # AppHeader, BottomNavigation, SafeBalanceCard, BalanceSettingsSheet,
│                 # PocketBreakdownSheet, SavingsMissionPreview, HoldUpWarningSheet, dsb.
├── composables/  # useExpenseFlow (jeda HoldUp!), useMoneySheets (Atur Saldo/rincian),
│                 # useDemoData (onboarding + reset)
├── db/           # index.js (skema Dexie), seed.js (data demo)
├── router/       # rute + guard onboarding
├── services/     # financeService.js — semua operasi finansial atomik + migrasi
├── stores/       # finance.js, missions.js, ui.js (Pinia = cermin reaktif dari IndexedDB)
├── utils/        # format Rupiah, tanggal, kategori, metadata kantong
└── views/        # Onboarding, Home, HoldupDetail, Pockets, Missions, Activity, Menu,
                  # TopUp, Placeholder
```
