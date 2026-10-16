<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import ProgressBar from './ProgressBar.vue'
import { formatPercent, formatRupiah } from '@/utils/format'
import { useFinanceStore } from '@/stores/finance'
import { useMissionsStore } from '@/stores/missions'

/**
 * Satu blok ringkas untuk tabungan: satu misi unggulan + ringkasan kantong.
 * Detail lengkap tetap berada di halaman Misi Tabungan dan halaman Kantong.
 */
const finance = useFinanceStore()
const missions = useMissionsStore()

const { featuredMission } = storeToRefs(missions)
const { billPocket, savingsPocket, emergencyPocket, savingsTarget, amountsHidden } =
  storeToRefs(finance)

function display(value) {
  return amountsHidden.value ? 'Rp••••' : formatRupiah(value)
}

const pocketRows = computed(() => [
  { key: 'bill', label: 'Tagihan', value: billPocket.value },
  { key: 'savings', label: 'Tabungan', value: savingsPocket.value },
  { key: 'emergency', label: 'Dana Darurat', value: emergencyPocket.value },
  { key: 'savingsTarget', label: 'Target Tabungan', value: savingsTarget.value },
])

const ratio = computed(() =>
  featuredMission.value ? missions.progressRatio(featuredMission.value) : 0,
)
const isComplete = computed(
  () => featuredMission.value && featuredMission.value.saved >= featuredMission.value.target,
)
</script>

<template>
  <section class="savings card" aria-labelledby="savings-heading">
    <div class="savings__head">
      <h2 id="savings-heading" class="section-title">Tabungan</h2>
      <RouterLink to="/misi" class="section-link">
        Lihat semua
        <AppIcon name="chevronRight" :size="15" />
      </RouterLink>
    </div>

    <template v-if="featuredMission">
      <RouterLink to="/misi" class="mission">
        <div class="mission__top">
          <p class="mission__name">{{ featuredMission.name }}</p>
          <span class="mission__percent tnum" :class="{ 'mission__percent--done': isComplete }">
            {{ formatPercent(ratio) }}
          </span>
        </div>
        <ProgressBar
          :value="ratio"
          :tone="isComplete ? 'success' : 'brand'"
          :label="`Progres misi ${featuredMission.name}`"
        />
        <p class="mission__meta tnum">
          {{ display(featuredMission.saved) }} dari {{ display(featuredMission.target) }}
        </p>
      </RouterLink>
    </template>

    <RouterLink v-else to="/misi" class="mission mission--empty">
      <AppIcon name="flag" :size="18" />
      <span>Belum ada misi tabungan. Buat tujuan pertama kamu.</span>
    </RouterLink>

    <p class="savings__note">
      Dana misi disimpan di kantong Tabungan, jadi tidak pernah dihitung dua kali.
    </p>
  </section>
</template>

<style scoped>
.savings {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.savings__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.mission {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 14px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.mission__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.mission__name {
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.mission__percent {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--brand);
}

.mission__percent--done {
  color: var(--positive);
}

.mission__meta {
  font-size: 12.5px;
  color: var(--ink-2);
}

.mission--empty {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.45;
}

.pockets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin: 0;
}

.pockets__item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.pockets__item dt {
  font-size: 11.5px;
  color: var(--ink-3);
  font-weight: 600;
}

.pockets__item dd {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.savings__note {
  font-size: 11.5px;
  color: var(--ink-3);
  line-height: 1.45;
}
</style>
