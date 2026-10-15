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
 * Fokus utama dashboard: status warna Saldo Aman (hijau / kuning / merah),
 * nominal besar, deskripsi singkat, dan jatah harian. Status datang dari satu
 * sumber terpusat (resolveSafeStatus) supaya konsisten di seluruh aplikasi.
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
    :class="`safe-card--${status.key}`"
    aria-labelledby="safe-balance-heading"
  >
    <h2 id="safe-balance-heading" class="sr-only">Saldo Aman</h2>

    <span class="safe-card__badge">
      <AppIcon :name="status.icon" :size="15" />
      {{ status.label }}
    </span>

    <p class="safe-card__amount tnum">{{ amountText }}</p>
    <p class="safe-card__desc">{{ status.description }}</p>

    <div class="safe-card__divider" />

    <DailyAllowance
      tone="plain"
      :amount="dailyAllowance"
      :remaining-days="remainingDays"
      :is-overdrawn="isOverdrawn"
      :month-label="monthLabel"
      :hidden="amountsHidden"
    />

    <div class="safe-card__actions">
      <button type="button" class="btn btn--primary safe-card__cta" @click="openBreakdown">
        Lihat rincian
        <AppIcon name="arrowRight" :size="17" />
      </button>
      <button v-if="status.key === 'over'" type="button" class="safe-card__link" @click="openBalance">
        Atur saldo
      </button>
    </div>
  </section>
</template>

<style scoped>
.safe-card {
  position: relative;
  overflow: hidden;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-xl);
  padding: 18px 18px 18px 22px;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--dur) var(--ease);
}

/* Aksen tipis di tepi kiri — warna status, bukan seluruh card. */
.safe-card::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 5px;
  background: var(--status-color, var(--brand));
  transition: background-color var(--dur) var(--ease);
}

.safe-card--safe {
  --status-color: var(--status-safe);
}

.safe-card--low {
  --status-color: var(--status-low);
}

.safe-card--over {
  --status-color: var(--status-over);
}

.safe-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.005em;
}

.safe-card--safe .safe-card__badge {
  background: var(--status-safe-tint);
  color: var(--status-safe-deep);
}

.safe-card--low .safe-card__badge {
  background: var(--status-low-tint);
  color: var(--status-low-deep);
}

.safe-card--over .safe-card__badge {
  background: var(--status-over-tint);
  color: var(--status-over-deep);
}

.safe-card__amount {
  margin-top: 14px;
  font-size: 40px;
  line-height: 1.02;
  font-weight: 750;
  letter-spacing: -0.04em;
  color: var(--ink);
}

.safe-card__desc {
  margin-top: 5px;
  font-size: 13px;
  color: var(--ink-2);
}

.safe-card__divider {
  height: 1px;
  margin: 17px 0 13px;
  background: var(--line);
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
  color: var(--brand);
  font-size: 13.5px;
  font-weight: 650;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.safe-card__link:hover {
  color: var(--brand-dark);
}

@media (min-width: 900px) {
  .safe-card {
    padding: 22px 22px 22px 26px;
  }

  .safe-card__amount {
    font-size: 46px;
  }
}
</style>
