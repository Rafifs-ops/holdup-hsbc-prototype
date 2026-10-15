/** Transaction categories shared by the expense form, activity list, and icons. */
export const CATEGORIES = [
  { value: 'makan', label: 'Makanan & Minuman', icon: 'coffee' },
  { value: 'belanja', label: 'Belanja', icon: 'cart' },
  { value: 'transport', label: 'Transportasi', icon: 'car' },
  { value: 'hiburan', label: 'Hiburan', icon: 'film' },
  { value: 'tagihan', label: 'Tagihan', icon: 'receipt' },
  { value: 'transfer', label: 'Transfer', icon: 'send' },
  { value: 'topup', label: 'Top up', icon: 'plus' },
  { value: 'lainnya', label: 'Lainnya', icon: 'briefcase' },
]

/**
 * Kategori yang ditawarkan pada halaman Bayar — ringkas dan realistis untuk
 * pembayaran mobile banking.
 */
export const PAYMENT_CATEGORIES = [
  { value: 'belanja', label: 'Belanja', icon: 'cart' },
  { value: 'makan', label: 'Makanan & Minuman', icon: 'coffee' },
  { value: 'transport', label: 'Transportasi', icon: 'car' },
  { value: 'tagihan', label: 'Tagihan', icon: 'receipt' },
  { value: 'lainnya', label: 'Lainnya', icon: 'briefcase' },
]

const FALLBACK = { value: 'lainnya', label: 'Lainnya', icon: 'briefcase' }

export function categoryMeta(value) {
  return CATEGORIES.find((item) => item.value === value) || FALLBACK
}
