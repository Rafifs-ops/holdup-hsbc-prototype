/**
 * Pembulatan Otomatis — aturan tunggal yang dipakai bersama oleh halaman Bayar,
 * store, dan service. Selisih pembulatan selalu berasal dari fungsi ini supaya
 * tidak ada perhitungan yang berbeda-beda antar komponen.
 *
 * Nominal dibulatkan ke atas ke kelipatan Rp1.000 berikutnya. Pembayaran yang
 * sudah kelipatan Rp1.000 menghasilkan selisih Rp0 (tidak ditambah Rp1.000).
 */

export const ROUND_UP_STEP = 1_000

/**
 * @param {number} amount nominal pembayaran (rupiah bulat)
 * @param {number} step   kelipatan pembulatan (default Rp1.000)
 * @returns {{ roundedAmount: number, roundUpSavings: number }}
 */
export function computeRoundUp(amount, step = ROUND_UP_STEP) {
  const value = Math.max(0, Math.round(Number(amount) || 0))
  const size = Math.max(1, Math.round(Number(step) || ROUND_UP_STEP))
  const roundedAmount = Math.ceil(value / size) * size
  return { roundedAmount, roundUpSavings: roundedAmount - value }
}
