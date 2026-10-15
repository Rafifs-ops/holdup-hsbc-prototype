<script setup>
import { computed } from 'vue'
import { formatRupiah } from '@/utils/format'

const props = defineProps({
  amount: { type: Number, default: 0 },
  remainingDays: { type: Number, default: 1 },
  isOverdrawn: { type: Boolean, default: false },
  monthLabel: { type: String, default: '' },
  hidden: { type: Boolean, default: false },
  tone: { type: String, default: 'onBrand' }, // onBrand | plain
})

const allowanceText = computed(() => {
  if (props.hidden) return 'Rp••••'
  return `${formatRupiah(props.isOverdrawn ? 0 : props.amount)} / hari`
})

const remainingText = computed(
  () => `${props.remainingDays} hari tersisa${props.monthLabel ? ` di ${props.monthLabel}` : ' di bulan ini'}`,
)
</script>

<template>
  <div class="daily" :class="`daily--${tone}`">
    <div class="daily__block">
      <p class="daily__label">Jatah hari ini</p>
      <p class="daily__value tnum">{{ allowanceText }}</p>
    </div>
    <div class="daily__block daily__block--right">
      <p class="daily__label">Sisa hari bulan ini</p>
      <p class="daily__value daily__value--muted tnum">{{ remainingText }}</p>
    </div>
  </div>
</template>

<style scoped>
.daily {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.daily__block {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.daily__block--right {
  text-align: right;
}

.daily__label {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  opacity: 0.78;
}

.daily__value {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.daily__value--muted {
  font-size: 13.5px;
  font-weight: 600;
}

.daily--onBrand .daily__label {
  color: rgba(255, 255, 255, 0.82);
}

.daily--onBrand .daily__value {
  color: #fff;
}

.daily--plain .daily__label {
  color: var(--ink-3);
}

.daily--plain .daily__value {
  color: var(--ink);
}
</style>
