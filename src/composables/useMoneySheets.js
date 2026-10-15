import { ref } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useUiStore } from '@/stores/ui'
import { formatRupiah } from '@/utils/format'

/**
 * Satu pengendali untuk sheet "Atur Saldo" dan "Rincian Saldo Aman".
 * Sheet ditumpuk sekali saja di App.vue, dan perpindahan antar-sheet selalu
 * berurutan (tutup dulu, buka kemudian) supaya tidak ada modal bertumpuk.
 */
const balanceOpen = ref(false)
const breakdownOpen = ref(false)

export function useMoneySheets() {
  const finance = useFinanceStore()
  const ui = useUiStore()

  function openBalance() {
    breakdownOpen.value = false
    balanceOpen.value = true
  }

  function closeBalance() {
    balanceOpen.value = false
  }

  function openBreakdown() {
    balanceOpen.value = false
    breakdownOpen.value = true
  }

  function closeBreakdown() {
    breakdownOpen.value = false
  }

  /** Rincian → Atur Saldo tanpa dua modal terbuka bersamaan. */
  function editFromBreakdown() {
    breakdownOpen.value = false
    balanceOpen.value = true
  }

  async function saveBalance(draft) {
    const result = await finance.saveSettings(draft)
    if (!result.ok) return result

    balanceOpen.value = false
    if (result.safeBalance < 0) {
      ui.pushToast(
        `Tersimpan. Saldo Aman sekarang minus ${formatRupiah(Math.abs(result.safeBalance))}.`,
        { tone: 'warn', duration: 4400 },
      )
    } else {
      ui.pushToast('Saldo simulasi dan alokasi diperbarui.')
    }
    return result
  }

  return {
    balanceOpen,
    breakdownOpen,
    openBalance,
    closeBalance,
    openBreakdown,
    closeBreakdown,
    editFromBreakdown,
    saveBalance,
  }
}
