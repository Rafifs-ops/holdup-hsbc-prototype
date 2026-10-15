import { ref } from 'vue'
import { seedManualData } from '@/services/financeService'
import { useFinanceStore } from '@/stores/finance'
import { useMissionsStore } from '@/stores/missions'
import { useUiStore } from '@/stores/ui'

/**
 * Onboarding dan reset data demo. Keduanya menulis ke IndexedDB lalu memuat
 * ulang state reaktif, sehingga angka di dashboard tidak pernah tertinggal.
 */
export function useDemoData() {
  const finance = useFinanceStore()
  const missions = useMissionsStore()
  const ui = useUiStore()
  const busy = ref(false)

  async function syncStores() {
    await finance.refresh()
    await missions.reload()
  }

  /** Mulai dari data demo (dipakai onboarding). */
  async function startWithDemo() {
    busy.value = true
    try {
      await finance.resetDemo()
      await missions.reload()
      ui.pushToast('Data demo siap. Kamu bisa reset kapan saja dari menu.', { tone: 'neutral' })
      return { ok: true }
    } finally {
      busy.value = false
    }
  }

  /** Onboarding dengan saldo simulasi buatan pengguna. */
  async function startManual(draft) {
    busy.value = true
    try {
      const result = await seedManualData(draft)
      if (!result.ok) return result
      await syncStores()
      ui.pushToast('Saldo simulasi kamu sudah tersimpan.')
      return result
    } finally {
      busy.value = false
    }
  }

  /** Kembalikan seluruh data ke kondisi demo. */
  async function resetDemo({ silent = false } = {}) {
    busy.value = true
    try {
      await finance.resetDemo()
      await missions.reload()
      if (!silent) {
        ui.pushToast('Data demo dikembalikan ke kondisi awal.', { tone: 'neutral' })
      }
      return { ok: true }
    } finally {
      busy.value = false
    }
  }

  return { busy, startWithDemo, startManual, resetDemo }
}
