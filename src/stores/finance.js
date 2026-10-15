import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import { daysRemainingInMonth } from '@/utils/date'
import { POCKET_DEFS, SAVINGS_TARGET_DEF } from '@/utils/pockets'
import {
  allocateToSavings as persistAllocation,
  initDatabase,
  loadSnapshot,
  recordExpense as persistExpense,
  recordIncome as persistIncome,
  resetToDemo as persistResetToDemo,
  saveBalanceSettings,
} from '@/services/financeService'

/**
 * State finansial reaktif. IndexedDB (lewat financeService) tetap menjadi
 * sumber penyimpanan; store ini hanya cermin di memori supaya UI reaktif.
 *
 *   Saldo Aman = Total Saldo − Tagihan − Tabungan − Dana Darurat − Target Tabungan
 *
 * Saldo Aman tidak pernah disimpan sebagai angka: selalu dihitung ulang.
 */
export const useFinanceStore = defineStore('finance', () => {
  /* ---------------------------------------------------------- boot state --- */
  const ready = ref(false)
  const error = ref('')

  /* ------------------------------------------------------------- state --- */
  const userName = ref('Rani Anggraini')
  const accountLabel = ref('Rekening Utama •••• 4821')
  const totalBalance = ref(0)
  const billPocket = ref(0)
  const savingsPocket = ref(0)
  const emergencyPocket = ref(0)
  const savingsTarget = ref(0)
  const onboarded = ref(false)
  const transactions = ref([])
  const amountsHidden = ref(false)

  /* --------------------------------------------------------------- clock --- */
  const now = ref(new Date())
  const clock = setInterval(() => {
    now.value = new Date()
  }, 60_000)
  onScopeDispose(() => clearInterval(clock))

  /* ------------------------------------------------------------ derived --- */
  /** Semua dana yang disisihkan: tiga kantong + nominal sisihan tambahan. */
  const totalAllocated = computed(
    () => billPocket.value + savingsPocket.value + emergencyPocket.value + savingsTarget.value,
  )
  const pocketAllocated = computed(() => billPocket.value + savingsPocket.value + emergencyPocket.value)

  /** Baris rincian Saldo Aman — semuanya dari database, bukan angka statis. */
  const safeBalanceBreakdown = computed(() => [
    { key: 'totalBalance', label: 'Total Saldo', value: totalBalance.value, kind: 'base' },
    { key: 'bill', label: 'Tagihan', value: billPocket.value, kind: 'deduction' },
    { key: 'savings', label: 'Tabungan', value: savingsPocket.value, kind: 'deduction' },
    { key: 'emergency', label: 'Dana Darurat', value: emergencyPocket.value, kind: 'deduction' },
    { key: 'savingsTarget', label: 'Target Tabungan', value: savingsTarget.value, kind: 'deduction' },
  ])

  const safeBalance = computed(
    () => totalBalance.value - pocketAllocated.value - savingsTarget.value,
  )
  const isOverdrawn = computed(() => safeBalance.value < 0)
  const remainingDays = computed(() => daysRemainingInMonth(now.value))
  const dailyAllowance = computed(() =>
    safeBalance.value > 0 ? Math.floor(safeBalance.value / remainingDays.value) : 0,
  )
  const allocationExceedsBalance = computed(() => totalAllocated.value > totalBalance.value)

  const status = computed(() => {
    if (isOverdrawn.value) {
      return {
        tone: 'danger',
        label: 'Saldo Aman terlampaui',
        message:
          'Saldo Aman kamu sudah lewat batas aman. Jatah harian Rp0 sampai kamu menambah saldo atau mengurangi sisihan.',
      }
    }
    if (totalBalance.value > 0 && safeBalance.value < totalBalance.value * 0.15) {
      return {
        tone: 'warn',
        label: 'Mulai menipis',
        message: 'Sisa Saldo Aman kamu sudah tipis untuk sisa bulan ini.',
      }
    }
    return {
      tone: 'ok',
      label: 'Masih aman',
      message: 'Saldo Aman kamu masih cukup untuk sisa bulan ini.',
    }
  })

  /** Kantong + Saldo Aman untuk halaman rincian. */
  const pockets = computed(() => [
    ...POCKET_DEFS.map((def) => ({ ...def, amount: pocketAmount(def.key) })),
    { ...SAVINGS_TARGET_DEF, amount: savingsTarget.value },
    {
      key: 'safe',
      label: 'Saldo Aman',
      icon: 'shield',
      accent: 'brand',
      description: 'Uang yang benar-benar tersedia untuk kamu gunakan.',
      amount: safeBalance.value,
    },
  ])

  function pocketAmount(key) {
    if (key === 'bill') return billPocket.value
    if (key === 'savings') return savingsPocket.value
    if (key === 'emergency') return emergencyPocket.value
    if (key === 'savingsTarget') return savingsTarget.value
    return 0
  }

  /* ---------------------------------------------------------- hydration --- */
  function applySnapshot(snapshot) {
    const settings = snapshot.settings
    if (settings) {
      userName.value = settings.userName || userName.value
      accountLabel.value = settings.accountLabel || accountLabel.value
      totalBalance.value = Number(settings.totalBalance) || 0
      savingsTarget.value = Number(settings.savingsTarget) || 0
      onboarded.value = Boolean(settings.onboarded)
    }
    billPocket.value = Number(snapshot.pockets?.bill) || 0
    savingsPocket.value = Number(snapshot.pockets?.savings) || 0
    emergencyPocket.value = Number(snapshot.pockets?.emergency) || 0
    transactions.value = snapshot.transactions || []
  }

  /** Dipanggil sekali sebelum aplikasi di-mount. */
  async function init() {
    try {
      const info = await initDatabase()
      const snapshot = await loadSnapshot()
      applySnapshot(snapshot)
      onboarded.value = Boolean(snapshot.settings?.onboarded ?? info.onboarded)
      ready.value = true
      error.value = ''
    } catch (err) {
      error.value =
        'Gagal membuka penyimpanan lokal (IndexedDB). Data mungkin tidak tersimpan sampai masalah ini selesai.'
      ready.value = false
      console.error('[HoldUp!] init database gagal:', err)
    }
    return { ready: ready.value, error: error.value }
  }

  async function refresh() {
    const snapshot = await loadSnapshot()
    applySnapshot(snapshot)
    return snapshot
  }

  /* ------------------------------------------------------------ actions --- */
  async function saveSettings(draft) {
    const result = await saveBalanceSettings(draft)
    if (!result.ok) return result

    totalBalance.value = Math.round(Number(draft.totalBalance))
    billPocket.value = Math.round(Number(draft.bill) || 0)
    savingsPocket.value = Math.round(Number(draft.savings) || 0)
    emergencyPocket.value = Math.round(Number(draft.emergency) || 0)
    savingsTarget.value = Math.round(Number(draft.savingsTarget) || 0)
    return result
  }

  async function recordExpense({ name, amount, category }) {
    const result = await persistExpense({ name, amount, category })
    if (!result.ok) return result

    totalBalance.value = result.totalBalance
    transactions.value = [result.transaction, ...transactions.value]
    return result
  }

  async function recordIncome({ name, amount, category }) {
    const result = await persistIncome({ name, amount, category })
    if (!result.ok) return result

    totalBalance.value = result.totalBalance
    transactions.value = [result.transaction, ...transactions.value]
    return result
  }

  /** Dipakai misi tabungan: memindahkan dana Saldo Aman ke kantong Tabungan. */
  async function allocateToSavings(amount, meta = {}) {
    const result = await persistAllocation({ amount, ...meta })
    if (!result.ok) return result

    savingsPocket.value += Math.round(Number(amount) || 0)
    if (result.row) transactions.value = [result.row, ...transactions.value]
    return result
  }

  async function resetDemo() {
    await persistResetToDemo()
    await refresh()
  }

  function toggleAmounts() {
    amountsHidden.value = !amountsHidden.value
  }

  return {
    // boot
    ready,
    error,
    init,
    refresh,
    // state
    userName,
    accountLabel,
    totalBalance,
    billPocket,
    savingsPocket,
    emergencyPocket,
    savingsTarget,
    onboarded,
    transactions,
    amountsHidden,
    now,
    // derived
    totalAllocated,
    pocketAllocated,
    safeBalanceBreakdown,
    safeBalance,
    isOverdrawn,
    remainingDays,
    dailyAllowance,
    allocationExceedsBalance,
    status,
    pockets,
    // actions
    saveSettings,
    recordExpense,
    recordIncome,
    allocateToSavings,
    resetDemo,
    toggleAmounts,
    pocketAmount,
  }
})
