/**
 * Status Saldo Aman — satu sumber kebenaran untuk indikator warna.
 *
 * Dipakai oleh card dashboard, halaman Bayar, dan sheet HoldUp! supaya seluruh
 * komponen selalu menampilkan status yang sama. Status TIDAK disimpan di
 * IndexedDB: selalu dihitung dari Saldo Aman dan Jatah Harian terkini (computed
 * state), sehingga tidak pernah usang.
 *
 * Aturan (threshold awal = 3 × Jatah Harian):
 *  - Hijau  "safe" : Saldo Aman > threshold.
 *  - Kuning "low"  : Saldo Aman > 0 dan ≤ threshold.
 *  - Merah  "over" : Saldo Aman ≤ 0 (termasuk nol dan negatif).
 *
 * Kalau Jatah Harian nol/belum tersedia saat Saldo Aman masih positif, threshold
 * ikut nol sehingga statusnya tetap hijau — tidak otomatis dianggap merah.
 */

export const SAFE_STATUS_THRESHOLD_MULTIPLIER = 3

export function safeStatusThreshold(dailyAllowance) {
  const daily = Math.max(0, Math.round(Number(dailyAllowance) || 0))
  return daily * SAFE_STATUS_THRESHOLD_MULTIPLIER
}

/** Jatah harian = floor(Saldo Aman / sisa hari). Saldo Aman ≤ 0 → 0. */
export function dailyAllowanceFor(safeBalance, remainingDays) {
  const safe = Number(safeBalance) || 0
  const days = Math.max(1, Math.round(Number(remainingDays) || 1))
  if (safe <= 0) return 0
  return Math.floor(safe / days)
}

export const SAFE_STATUS_META = {
  safe: {
    key: 'safe',
    tone: 'safe',
    label: 'Saldo Aman',
    description: 'Kondisi keuanganmu masih terkendali.',
    message: 'Saldo Aman kamu masih cukup untuk sisa bulan ini.',
    icon: 'checkCircle',
  },
  low: {
    key: 'low',
    tone: 'low',
    label: 'Saldo Menipis',
    description: 'Sisa dana amanmu mulai terbatas.',
    message: 'Sisa Saldo Aman kamu mulai tipis untuk sisa bulan ini.',
    icon: 'alertTriangle',
  },
  over: {
    key: 'over',
    tone: 'over',
    label: 'Saldo Aman Terlampaui',
    description: 'Pengeluaranmu sudah melewati batas saldo yang direncanakan.',
    message:
      'Saldo Aman kamu sudah nol atau minus, jadi jatah harian Rp0. Kamu tetap bisa bertransaksi — tambah saldo atau kurangi sisihan untuk mengembalikannya.',
    icon: 'alertCircle',
  },
}

/**
 * @returns {{ key, tone, label, description, message, icon, threshold, safeBalance, dailyAllowance }}
 */
export function resolveSafeStatus({ safeBalance, dailyAllowance } = {}) {
  const safe = Math.round(Number(safeBalance) || 0)
  const daily = Math.max(0, Math.round(Number(dailyAllowance) || 0))
  const threshold = safeStatusThreshold(daily)

  // Urutan dijaga supaya status tidak pernah tumpang tindih: nol/negatif selalu
  // merah lebih dulu, lalu hijau, sisanya kuning.
  let key = 'low'
  if (safe <= 0) key = 'over'
  else if (safe > threshold) key = 'safe'

  return {
    ...SAFE_STATUS_META[key],
    threshold,
    safeBalance: safe,
    dailyAllowance: daily,
  }
}
