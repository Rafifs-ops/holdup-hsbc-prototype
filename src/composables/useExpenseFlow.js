import { ref } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useUiStore } from '@/stores/ui'
import { formatRupiah } from '@/utils/format'

/**
 * Alur pengeluaran: satu sumber kebenaran supaya semua tombol "Catat
 * pengeluaran" (dashboard, halaman HoldUp!, menu) memakai sheet yang sama.
 *
 *  - Kalau nominal masih di bawah Saldo Aman → transaksi langsung disimpan.
 *  - Kalau melewati Saldo Aman → jeda HoldUp! dulu, pengguna tetap bebas lanjut.
 *
 * Modul-scoped state = dibagi ke seluruh komponen tanpa prop drilling.
 */
const entryOpen = ref(false)
const warningOpen = ref(false)
const intent = ref(null)
const busy = ref(false)

export function useExpenseFlow() {
  const finance = useFinanceStore()
  const ui = useUiStore()

  function openEntry(prefill = {}) {
    intent.value = prefill.amount
      ? {
          name: prefill.name || '',
          amount: prefill.amount,
          category: prefill.category || 'belanja',
        }
      : null
    warningOpen.value = false
    entryOpen.value = true
  }

  function closeEntry() {
    entryOpen.value = false
  }

  /** Dipanggil sheet input. Memutuskan: langsung simpan atau beri jeda. */
  function submitExpense({ name, amount, category }) {
    const value = Math.round(Number(amount) || 0)
    if (value <= 0) {
      return { ok: false, error: 'Nominal harus lebih besar dari Rp0.' }
    }

    const purchase = {
      name: String(name || '').trim() || 'Pembelian',
      amount: value,
      category: category || 'belanja',
      safeBefore: finance.safeBalance,
      safeAfter: finance.safeBalance - value,
      shortfall: Math.max(0, value - finance.safeBalance),
    }

    entryOpen.value = false

    if (purchase.shortfall > 0) {
      intent.value = purchase
      warningOpen.value = true
      return { ok: true, overSafe: true, purchase }
    }

    commit(purchase)
    return { ok: true, overSafe: false, purchase }
  }

  async function commit(purchase) {
    busy.value = true
    try {
      const result = await finance.recordExpense({
        name: purchase.name,
        amount: purchase.amount,
        category: purchase.category,
      })

      if (!result.ok) {
        ui.pushToast(result.error, { tone: 'warn' })
        return result
      }

      ui.pushToast(`Pengeluaran ${formatRupiah(purchase.amount)} tercatat.`)
      if (result.safeAfter < 0) {
        ui.pushToast('Saldo Aman kamu sekarang minus. Kamu tetap bisa bertransaksi.', {
          tone: 'warn',
          duration: 4400,
        })
      }
      intent.value = null
      return result
    } catch (err) {
      console.error('[HoldUp!] gagal menyimpan pengeluaran:', err)
      ui.pushToast('Transaksi gagal disimpan. Saldo kamu tidak berubah.', {
        tone: 'warn',
        duration: 4400,
      })
      return { ok: false, error: 'Gagal menyimpan transaksi.' }
    } finally {
      busy.value = false
    }
  }

  /** “Saya paham, lanjutkan” */
  async function confirmPurchase() {
    const purchase = intent.value
    warningOpen.value = false
    if (!purchase) return null
    return commit(purchase)
  }

  /** “Batalkan” — tidak ada satu pun data yang berubah. */
  function cancelPurchase() {
    warningOpen.value = false
    intent.value = null
    ui.pushToast('Pembelian dibatalkan. Saldo kamu tidak berubah.', { tone: 'neutral' })
  }

  function closeWarning() {
    warningOpen.value = false
    intent.value = null
  }

  return {
    entryOpen,
    warningOpen,
    intent,
    busy,
    openEntry,
    closeEntry,
    submitExpense,
    confirmPurchase,
    cancelPurchase,
    closeWarning,
  }
}
