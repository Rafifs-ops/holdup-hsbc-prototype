<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import DailyAllowance from './DailyAllowance.vue'
import { formatRupiah } from '@/utils/format'
import { monthNameLong } from '@/utils/date'
import { useFinanceStore } from '@/stores/finance'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * Fokus utama dashboard: besar, jelas, dan hanya berisi hal-hal penting —
 * nominal, status, jatah harian, dan jumlah hari tersisa. Rincian kantong
 * dibuka lewat tombol “Lihat rincian”.
 */
const finance = useFinanceStore()
const { safeBalance, isOverdrawn, dailyAllowance, remainingDays, amountsHidden, status } =
  storeToRefs(finance)
const { openBreakdown, openBalance } = useMoneySheets()

const amountText = computed(() =>
  amountsHidden.value ? 'Rp•••••••' : formatRupiah(safeBalance.value),
)
const monthLabel = computed(() => monthNameLong())
</script>

<template>
  <section
    class="safe-card"
    :class="{ 'safe-card--negative': isOverdrawn }"
    aria-labelledby="safe-balance-heading"
  >
    <div class="safe-card__top">
      <h2 id="safe-balance-heading" class="safe-card__label">Saldo Aman</h2>
      <span class="safe-card__status" :class="`safe-card__status--${status.tone}`">
        <span class="safe-card__status-dot" aria-hidden="true" />
        {{ status.label }}
      </span>
    </div>

    <p class="safe-card__amount tnum">{{ amountText }}</p>
    <p class="safe-card__desc">Uang yang tersedia untuk kamu gunakan</p>

    <div class="safe-card__divider" />

    <DailyAllowance
      :amount="dailyAllowance"
      :remaining-days="remainingDays"
      :is-overdrawn="isOverdrawn"
      :month-label="monthLabel"
      :hidden="amountsHidden"
    />

    <p v-if="isOverdrawn" class="safe-card__alert" role="status">
      <AppIcon name="alert" :size="17" />
      <span>
        Saldo Aman kamu minus, jadi jatah harian Rp0. Kamu tetap bisa bertransaksi — kurangi
        sisihan atau tambah saldo untuk mengembalikannya.
      </span>
    </p>

    <div class="safe-card__actions">
      <button type="button" class="btn btn--light safe-card__cta" @click="openBreakdown">
        Lihat rincian
        <AppIcon name="arrowRight" :size="17" />
      </button>
      <button v-if="isOverdrawn" type="button" class="safe-card__link" @click="openBalance">
        Atur saldo
      </button>
    </div>
  </section>
</template>

<style scoped>
.safe-card {
  position: relative;
  overflow: hidden;
  background: var(--brand);
  color: #fff;
  border-radius: var(--r-xl);
  padding: 20px 18px 18px;
  box-shadow: 0 20px 38px -24px rgba(219, 0, 17, 0.8);
}

.safe-card::after {
  content: '';
  position: absolute;
  top: -70px;
  right: -60px;
  width: 190px;
  height: 190px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  pointer-events: none;
}

.safe-card--negative {
  background: var(--brand-deep);
}

.safe-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.safe-card__label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.88);
}

.safe-card__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.32);
  font-size: 11.5px;
  font-weight: 650;
  white-space: nowrap;
}

.safe-card__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}

.safe-card__status--warn .safe-card__status-dot {
  background: #ffd9d6;
}

.safe-card__amount {
  margin-top: 14px;
  font-size: 40px;
  line-height: 1.02;
  font-weight: 750;
  letter-spacing: -0.04em;
}

.safe-card__desc {
  margin-top: 5px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.86);
}

.safe-card__divider {
  height: 1px;
  margin: 17px 0 13px;
  background: rgba(255, 255, 255, 0.26);
}

.safe-card__alert {
  display: flex;
  gap: 9px;
  margin-top: 15px;
  padding: 11px 12px;
  border-radius: var(--r-md);
  background: rgba(0, 0, 0, 0.22);
  font-size: 12.5px;
  line-height: 1.5;
}

.safe-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 17px;
}

.safe-card__cta {
  flex: 1;
}

.safe-card__link {
  border: 0;
  background: none;
  padding: 10px 6px;
  min-height: 44px;
  color: #fff;
  font-size: 13.5px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.safe-card__link:hover {
  opacity: 0.85;
}

@media (min-width: 900px) {
  .safe-card {
    padding: 24px 22px 22px;
  }

  .safe-card__amount {
    font-size: 46px;
  }
}
</style>
