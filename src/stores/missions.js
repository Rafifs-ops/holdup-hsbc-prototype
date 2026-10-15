import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  addFundsToMission,
  createMission as persistCreateMission,
  loadMissions,
} from '@/services/financeService'
import { useFinanceStore } from '@/stores/finance'

/**
 * Misi tabungan memisahkan tiga hal yang sering tercampur:
 *
 *  1. `target`  — target jangka panjang misi (tidak mengurangi Saldo Aman).
 *  2. `saved`   — dana yang sudah terkumpul, dan uangnya benar-benar berada di
 *                 kantong Tabungan. Karena kantong sudah dikurangi pada formula
 *                 Saldo Aman, dana ini tidak boleh dihitung lagi.
 *  3. Target Tabungan (`finance.savingsTarget`) — nominal tambahan yang ingin
 *                 disisihkan bulan ini dan belum masuk kantong mana pun.
 */
export const useMissionsStore = defineStore('missions', () => {
  const finance = useFinanceStore()

  const missions = ref([])
  const ready = ref(false)
  const error = ref('')

  /* ---------------------------------------------------------- hydration --- */
  async function init() {
    try {
      missions.value = await loadMissions()
      ready.value = true
      error.value = ''
    } catch (err) {
      error.value = 'Gagal membaca misi tabungan dari penyimpanan lokal.'
      console.error('[HoldUp!] init misi gagal:', err)
    }
  }

  async function reload() {
    missions.value = await loadMissions()
  }

  /** Setelah perubahan misi, tarik ulang misi + kantong + transaksi. */
  async function syncAfterMutation() {
    missions.value = await loadMissions()
    await finance.refresh()
  }

  /* ------------------------------------------------------------ derived --- */
  const missionCount = computed(() => missions.value.length)
  const hasMissions = computed(() => missionCount.value > 0)

  const totalSaved = computed(() =>
    missions.value.reduce((sum, mission) => sum + Math.max(0, Number(mission.saved) || 0), 0),
  )
  const totalTarget = computed(() =>
    missions.value.reduce((sum, mission) => sum + Math.max(0, Number(mission.target) || 0), 0),
  )

  /** Dana di kantong Tabungan yang belum ditugaskan ke misi mana pun. */
  const unallocatedSavings = computed(() =>
    Math.max(0, finance.savingsPocket - totalSaved.value),
  )

  /** Kantong Tabungan lebih kecil dari total dana misi — perlu peringatan, bukan potong diam-diam. */
  const savingsPocketShortfall = computed(() =>
    Math.max(0, totalSaved.value - finance.savingsPocket),
  )

  const featuredMission = computed(() => {
    if (!missions.value.length) return null
    return [...missions.value].sort((a, b) => progressRatio(b) - progressRatio(a))[0]
  })

  function progressRatio(mission) {
    const target = Number(mission?.target) || 0
    if (target <= 0) return 0
    return Math.min(Math.max((Number(mission?.saved) || 0) / target, 0), 1)
  }

  function remainingToSave(mission) {
    return Math.max(0, (Number(mission?.target) || 0) - (Number(mission?.saved) || 0))
  }

  /* ------------------------------------------------------------ actions --- */
  async function createMission({ name, target, initialAmount = 0 }) {
    const result = await persistCreateMission({ name, target, initialAmount })
    if (!result.ok) return result
    await syncAfterMutation()
    return result
  }

  async function addFunds(id, amount) {
    const result = await addFundsToMission({ missionId: id, amount })
    if (!result.ok) return result
    await syncAfterMutation()
    return result
  }

  return {
    // boot
    ready,
    error,
    init,
    reload,
    // state
    missions,
    // derived
    missionCount,
    hasMissions,
    totalSaved,
    totalTarget,
    unallocatedSavings,
    savingsPocketShortfall,
    featuredMission,
    progressRatio,
    remainingToSave,
    // actions
    createMission,
    addFunds,
  }
})
