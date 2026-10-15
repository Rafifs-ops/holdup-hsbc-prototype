/**
 * Formatting helpers for Indonesian Rupiah amounts and numeric inputs.
 * Kept free of Vue imports so they can be reused anywhere in the prototype.
 */

const idNumber = new Intl.NumberFormat('id-ID')

/** 4000000 -> "Rp4.000.000", -200000 -> "-Rp200.000" */
export function formatRupiah(value) {
  const amount = Math.round(toNumber(value))
  const sign = amount < 0 ? '-' : ''
  return `${sign}Rp${idNumber.format(Math.abs(amount))}`
}

/** 500000 -> "+Rp500.000", -28000 -> "-Rp28.000" */
export function formatSignedRupiah(value) {
  const amount = Math.round(toNumber(value))
  const sign = amount < 0 ? '-' : '+'
  return `${sign}Rp${idNumber.format(Math.abs(amount))}`
}

/** 4000000 -> "4.000.000" (used for form inputs) */
export function formatNumberInput(value) {
  const amount = Math.round(Math.abs(toNumber(value)))
  return idNumber.format(amount)
}

/** "4.000.000" / "Rp 4.000.000" / 4000000 -> 4000000 */
export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (value === null || value === undefined) return 0
  const digits = String(value).replace(/[^\d-]/g, '')
  if (digits === '' || digits === '-') return 0
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Validate a typed expense/target amount.
 * Returns { valid, error, value } so forms can show inline messages.
 */
export function validateAmountInput(raw, { label = 'Nominal', min = 1, max = Infinity } = {}) {
  const trimmed = String(raw ?? '').trim()
  if (trimmed === '') {
    return { valid: false, error: `${label} wajib diisi.`, value: 0 }
  }
  if (!/^[\d.\s]+$/.test(trimmed)) {
    return { valid: false, error: `${label} hanya boleh berisi angka.`, value: 0 }
  }
  const value = toNumber(trimmed)
  if (value <= 0) {
    return { valid: false, error: `${label} harus lebih besar dari Rp0.`, value }
  }
  if (value < min) {
    return { valid: false, error: `Minimal ${formatRupiah(min)}.`, value }
  }
  if (value > max) {
    return { valid: false, error: `Maksimal ${formatRupiah(max)}.`, value }
  }
  return { valid: true, error: '', value }
}

/** 3600000 -> "Rp3,6 jt" — only used for tight spaces like pocket chips. */
export function formatCompactRupiah(value) {
  const amount = Math.round(toNumber(value))
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000_000) return `${sign}Rp${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`
  if (abs >= 1_000_000) return `${sign}Rp${(abs / 1_000_000).toFixed(1).replace('.', ',')} jt`
  if (abs >= 1_000) return `${sign}Rp${Math.round(abs / 1_000)} rb`
  return `${sign}Rp${abs}`
}

/** 0.42 -> "42%" */
export function formatPercent(ratio) {
  const clamped = Math.max(0, Number.isFinite(ratio) ? ratio : 0)
  return `${Math.round(clamped * 100)}%`
}

/** Initials for the avatar placeholder: "Rani Anggraini" -> "RA" */
export function initialsFrom(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}
