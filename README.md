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
| Menu | `/menu` | Profil, pengaturan Pembulatan Otomatis, layanan, Atur Saldo, reset data demo dengan konfirmasi |
| Top Up | `/topup` | Mencatat pemasukan agar perubahan saldo bisa ditelusuri |
| Bayar | `/bayar` | Form pembayaran mobile banking: kategori, deskripsi, nominal, rincian pembulatan, CTA di bawah |
| Placeholder | `/transfer`, `/layanan` | Halaman dummy dengan layout konsisten |

**Pembayaran** dimulai dari pintasan “Bayar”, halaman HoldUp!, atau menu. Nominal yang melewati
Saldo Aman memunculkan sheet jeda berisi nominal pembayaran, Saldo Aman saat ini, dan Saldo Aman
setelah pembayaran — dengan dua pilihan: “Saya paham, lanjutkan” atau “Batalkan”. Membatalkan
tidak mengubah satu pun data.

## Pembulatan Otomatis

Fitur opsional (default **nonaktif**) yang membulatkan setiap pembayaran ke atas ke kelipatan
**Rp1.000** dan menyisihkan selisihnya ke kantong Tabungan:

```
roundedAmount = Math.ceil(paymentAmount / 1000) * 1000
roundUp       = roundedAmount − paymentAmount
```

Contoh: bayar Rp21.700 → Rp22.000, selisih Rp300 masuk Tabungan. Pembayaran tetap tercatat
Rp21.700 kepada merchant; Rp300 adalah alokasi tambahan ke Tabungan, bukan biaya tambahan.
Pembayaran yang sudah kelipatan Rp1.000 (mis. Rp25.000) menghasilkan selisih Rp0.

Perhitungannya ada di satu tempat, `src/utils/roundup.js` (`computeRoundUp`), dan dipakai baik
untuk pratinjau di halaman Bayar maupun saat menyimpan. Status fitur disimpan di baris
`settings.autoRoundupEnabled` sehingga tetap konsisten setelah refresh. Pembayaran + alokasi
Tabungan + riwayat ditulis dalam **satu transaksi Dexie** (`recordPayment`); jika salah satu
gagal, seluruh perubahan dibatalkan.

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

## Indikator status Saldo Aman

Card Saldo Aman memberi tahu kondisi keuangan lewat warna, ikon, dan label (bukan warna saja):

| Status | Kondisi | Warna | Ikon | Label |
| --- | --- | --- | --- | --- |
| Hijau — Aman | Saldo Aman > 3 × Jatah Harian | `#16A34A` | check-circle | Saldo Aman |
| Kuning — Menipis | Saldo Aman > 0 dan ≤ 3 × Jatah Harian | `#D97706` | alert-triangle | Saldo Menipis |
| Merah — Terlampaui | Saldo Aman ≤ 0 (nol atau negatif) | `#DB0011` | alert-circle | Saldo Aman Terlampaui |

- Perhitungannya ada di satu tempat, `src/utils/safeStatus.js` (`resolveSafeStatus`); store
  `finance.status` adalah computed dari sana sehingga card dashboard, halaman Bayar, dan sheet
  HoldUp! selalu menampilkan status yang sama dan langsung berubah saat saldo/kantong berubah.
- Jika Jatah Harian nol/belum tersedia (mis. saldo kecil), threshold ikut nol sehingga Saldo Aman
  positif tetap hijau — tidak otomatis dianggap merah. Nilai nol ditangani eksplisit agar status
  tidak tumpang tindih.
- Status **tidak** disimpan di IndexedDB; selalu dihitung dari kondisi saldo terkini.
- Halaman Bayar menampilkan estimasi status setelah transaksi (termasuk pembulatan otomatis),
  dan sheet HoldUp! menampilkan status yang akan berlaku bila pengguna melanjutkan.

## Penyimpanan (Dexie + IndexedDB)

`src/db/index.js` mendefinisikan satu database (`holdup`) dengan empat tabel:

| Tabel | Isi |
| --- | --- |
| `settings` | baris `main` = total saldo, Target Tabungan, `autoRoundupEnabled`, nama, status onboarding; baris `meta` = bookkeeping migrasi |
| `pockets` | alokasi `bill` / `savings` / `emergency` |
| `missions` | misi tabungan (nama, target, saved, status, createdAt) |
| `transactions` | riwayat lengkap: pembayaran, pemasukan, dan alokasi internal (mis. pembulatan ke Tabungan) |

Aturan yang dipegang:

1. **Semua mutasi uang lewat `src/services/financeService.js`.** Operasi yang menyentuh lebih
   dari satu tabel dibungkus `db.transaction('rw', ...)` sehingga saldo, kantong, dan riwayat
   tidak pernah terpisah saat terjadi error. Pembayaran dan alokasi pembulatan disimpan
   bersama dalam `recordPayment()`, dan pembulatan dibaca dari settings **di dalam** transaksi
   agar UI dan database tidak bisa berbeda.
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
3. **Persistensi:** ubah saldo lewat “Atur Saldo”, lakukan pembayaran, lalu refresh halaman —
   angka terakhir harus tetap sama (IndexedDB).
4. **Formula:** “Lihat rincian” menampilkan Total Saldo − Tagihan − Tabungan − Dana Darurat −
   Target Tabungan = Saldo Aman; coba contoh Rp10.000.000 − 2.000.000 − 1.500.000 − 1.000.000 −
   500.000 → Rp5.000.000.
5. **Jeda HoldUp!:** bayar lebih besar dari Saldo Aman → sheet jeda muncul. “Batalkan” tidak
   mengubah saldo maupun riwayat; “Saya paham, lanjutkan” menyimpan transaksi dan memperbarui
   dashboard.
6. **Pembulatan Otomatis:** Menu → aktifkan toggle “Pembulatan Otomatis” (tetap aktif setelah
   refresh), lalu Bayar Rp21.700 → pratinjau menampilkan “+Rp300 / Ditabung otomatis Rp300 /
   Total dana yang dialokasikan Rp22.000”. Setelah berhasil, kantong Tabungan naik Rp300 dan
   riwayat mencatat pembayaran Rp21.700 **dan** alokasi Rp300 secara terpisah. Bayar Rp25.000
   tidak menghasilkan selisih; saat fitur nonaktif, tidak ada alokasi sama sekali.
7. **Status warna:** dengan data demo (Saldo Aman Rp3.500.000) card tampil **hijau**. Buka
   “Atur Saldo”, naikkan alokasi sampai Saldo Aman tinggal di bawah ±3× jatah harian → **kuning**;
   naikkan lagi sampai Saldo Aman ≤ 0 → **merah**. Indikator berubah tanpa refresh. Di halaman
   Bayar, isi nominal besar agar estimasi status “setelah pembayaran” ikut berubah; batalkan
   pembayaran → status dashboard tidak berubah.
8. **Misi tanpa hitung ganda:** danai sebuah misi, lalu pastikan Saldo Aman turun tepat sebesar
   dana yang dipindahkan dan total saldo tidak berubah.
9. **Tanpa hitung ganda pembulatan:** setelah pembayaran dengan pembulatan, Saldo Aman turun
   tepat sebesar Rp22.000 (bukan Rp22.300), dan Target Tabungan tidak ikut berubah. Kantong
   Tabungan yang bertambah juga langsung memengaruhi status warna.
10. **Reset:** Menu → “Reset data demo” menampilkan konfirmasi lebih dulu.

## Struktur

```
src/
├── components/   # AppHeader, BottomNavigation, SafeBalanceCard, BalanceSettingsSheet,
│                 # PocketBreakdownSheet, SavingsMissionPreview, HoldUpWarningSheet, ToggleSwitch, dsb.
├── composables/  # useMoneySheets (Atur Saldo/rincian), useDemoData (onboarding + reset)
├── db/           # index.js (skema Dexie), seed.js (data demo)
├── router/       # rute + guard onboarding
├── services/     # financeService.js — semua operasi finansial atomik + migrasi
├── stores/       # finance.js, missions.js, ui.js (Pinia = cermin reaktif dari IndexedDB)
├── utils/        # format Rupiah, tanggal, kategori pembayaran, metadata kantong, pembulatan otomatis, status Saldo Aman
└── views/        # Onboarding, Home, HoldupDetail, Pockets, Missions, Activity, Menu,
                  # TopUp, PayView (Bayar), Placeholder
```
