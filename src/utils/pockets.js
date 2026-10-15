/** Metadata kantong yang dipakai bersama oleh dashboard, sheet, dan halaman detail. */

export const POCKET_DEFS = [
  {
    key: 'bill',
    label: 'Tagihan',
    icon: 'receipt',
    description: 'Dana yang kamu sisihkan untuk tagihan rutin bulan ini.',
  },
  {
    key: 'savings',
    label: 'Tabungan',
    icon: 'target',
    description: 'Tempat dana untuk misi tabungan dan rencana kamu.',
  },
  {
    key: 'emergency',
    label: 'Dana Darurat',
    icon: 'umbrella',
    description: 'Cadangan untuk hal tak terduga, tetap kamu kendalikan.',
  },
]

/**
 * Target Tabungan = nominal tambahan yang ingin disisihkan dan belum masuk
 * kantong mana pun. Berbeda dari target jangka panjang sebuah misi: angka ini
 * ikut mengurangi Saldo Aman, sedangkan target misi tidak.
 */
export const SAVINGS_TARGET_DEF = {
  key: 'savingsTarget',
  label: 'Target Tabungan',
  icon: 'sparkle',
  description: 'Nominal tambahan yang ingin kamu sisihkan. Bukan target jangka panjang misi.',
}
