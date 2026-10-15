<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import BaseSheet from './BaseSheet.vue'
import DailyAllowance from './DailyAllowance.vue'
import { formatRupiah } from '@/utils/format'
import { monthNameLong } from '@/utils/date'
import { useFinanceStore } from '@/stores/finance'
import { useMissionsStore } from '@/stores/missions'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * “Rincian Saldo Aman” — memperlihatkan asal setiap nominal langsung dari
 * database, jadi pengguna bisa menelusuri angka di kartu utama.
 */
const finance = useFinanceStore()
const missions = useMissionsStore()
const { breakdownOpen, closeBreakdown, editFromBreakdown } = useMoneySheets()

const {
  safeBalanceBreakdown,
  safeBalance,
  isOverdrawn,
  dailyAllowance,
  remainingDays,
  amountsHidden,
  totalAllocated,
} = storeToRefs(finance)
const { totalSaved, unallocatedSavings } = storeToRefs(missions)

const rows = computed(() =>
  safeBalanceBreakdown.value.map((row) => ({
    ...row,
    valueText: amountsHidden.value ? 'Rp••••' : formatRupiah(row.value),
  })),
)

const totalText = computed(() => formatRupiah(safeBalance.value))
const allocatedText = computed(() => formatRupiah(totalAllocated.value))

function edit() {
  closeBreakdown()
  editFromBreakdown()
}
</script>

<template>
  <BaseSheet
    :open="breakdownOpen"
    title="Rincian Saldo Aman"
    subtitle="Semua angka diambil dari data tersimpan di perangkat ini."
    @close="closeBreakdown"
  >
    <div class="breakdown">
      <div class="hero" :class="{ 'hero--negative': isOverdrawn }">
        <p class="hero__label">Saldo Aman</p>
        <p class="hero__amount tnum">{{ amountsHidden ? 'Rp•••••••' : totalText }}</p>
        <p class="hero__note">
          {{ formatRupiah(dailyAllowance) }} / hari • {{ remainingDays }} hari tersisa
          {{ monthNameLong() }}
        </p>
      </div>

      <dl class="rows">
        <div v-for="row in rows" :key="row.key" class="rows__item">
          <dt>
            <span class="rows__icon" aria-hidden="true">
              <AppIcon :name="row.kind === 'base' ? 'wallet' : 'minus'" :size="16" />
            </span>
            {{ row.label }}
          </dt>
          <dd class="tnum" :class="{ 'rows__value--deduct': row.kind === 'deduction' }">
            <span v-if="row.kind === 'deduction'" aria-hidden="true">−</span>{{ row.valueText }}
          </dd>
        </div>
        <div class="rows__item rows__item--result">
          <dt>Saldo Aman</dt>
          <dd class="tnum" :class="{ 'is-negative': isOverdrawn }">
            {{ amountsHidden ? 'Rp•••••••' : totalText }}
          </dd>
        </div>
      </dl>

      <p class="formula">
        Saldo Aman = Total Saldo − Tagihan − Tabungan − Dana Darurat − Target Tabungan
      </p>

      <div class="notes">
        <p class="notes__item">
          <AppIcon name="info" :size="16" />
          <span>
            Total disisihkan saat ini {{ allocatedText }}. Dana misi tabungan
            ({{ formatRupiah(totalSaved) }}) sudah termasuk di kantong Tabungan, jadi tidak
            dihitung dua kali.
          </span>
        </p>
        <p class="notes__item">
          <AppIcon name="target" :size="16" />
          <span>
            Target Tabungan adalah nominal sisihan tambahan bulan ini — berbeda dari target
            jangka panjang pada misi tabungan.
          </span>
        </p>
      </div>

      <p v-if="isOverdrawn" class="alert">
        <AppIcon name="alert" :size="17" />
        <span>
          Saldo Aman kamu minus. Jatah harian Rp0 sampai saldo ditambah atau sisihan dikurangi.
        </span>
      </p>

      <p class="foot">
        {{ formatRupiah(unallocatedSavings) }} di kantong Tabungan belum ditugaskan ke misi mana pun.
      </p>
    </div>

    <template #footer>
      <button type="button" class="btn btn--primary btn--block" @click="edit">
        <AppIcon name="settings" :size="17" />
        Atur saldo & kantong
      </button>
      <button type="button" class="btn btn--ghost btn--block" @click="closeBreakdown">Tutup</button>
    </template>
  </BaseSheet>
</template>

<style scoped>
.breakdown {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 6px;
}

.hero {
  padding: 16px;
  border-radius: var(--r-lg);
  background: var(--brand-tint);
  border: 1px solid var(--brand-tint-strong);
}

.hero--negative {
  background: #fff;
  border-color: var(--brand);
}

.hero__label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-deep);
}

.hero__amount {
  margin-top: 4px;
  font-size: 30px;
  font-weight: 750;
  letter-spacing: -0.03em;
  color: var(--brand-deep);
}

.hero__note {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-2);
}

.rows {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.rows__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
}

.rows__item dt {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 14px;
  color: var(--ink-2);
}

.rows__item dd {
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.rows__value--deduct {
  color: var(--ink-2);
}

.rows__icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--ink-2);
  flex: none;
}

.rows__item--result {
  border-bottom: 0;
  padding-top: 14px;
}

.rows__item--result dt,
.rows__item--result dd {
  font-size: 17px;
  font-weight: 750;
  color: var(--brand);
}

.is-negative {
  color: var(--brand) !important;
}

.formula {
  padding: 11px 13px;
  border-radius: var(--r-sm);
  background: var(--surface-2);
  border: 1px dashed var(--line-strong);
  font-size: 12px;
  line-height: 1.5;
  color: var(--ink-2);
}

.notes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notes__item {
  display: flex;
  gap: 9px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-2);
}

.alert {
  display: flex;
  gap: 9px;
  padding: 12px 13px;
  border-radius: var(--r-md);
  background: var(--brand-tint);
  border: 1px solid var(--brand-tint-strong);
  color: var(--brand-deep);
  font-size: 12.5px;
  line-height: 1.5;
}

.foot {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}
</style>
