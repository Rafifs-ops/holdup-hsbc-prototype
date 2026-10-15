<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import SafeBalanceCard from '@/components/SafeBalanceCard.vue'
import DailyAllowance from '@/components/DailyAllowance.vue'
import { formatRupiah } from '@/utils/format'
import { monthNameLong } from '@/utils/date'
import { useFinanceStore } from '@/stores/finance'
import { useMissionsStore } from '@/stores/missions'
import { useExpenseFlow } from '@/composables/useExpenseFlow'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * Halaman penjelasan HoldUp!: apa itu Saldo Aman, bagaimana rumusnya, dan apa
 * yang terjadi ketika sebuah pembelian melewatinya.
 */
const finance = useFinanceStore()
const missions = useMissionsStore()
const router = useRouter()
const { openEntry } = useExpenseFlow()
const { openBalance, openBreakdown } = useMoneySheets()

const { safeBalanceBreakdown, safeBalance, dailyAllowance, remainingDays, isOverdrawn, amountsHidden, status } =
  storeToRefs(finance)
const { totalSaved } = storeToRefs(missions)

const rows = computed(() =>
  safeBalanceBreakdown.value.map((row) => ({
    ...row,
    valueText: amountsHidden.value ? 'Rp••••' : formatRupiah(row.value),
  })),
)

const steps = [
  {
    icon: 'wallet',
    title: 'Saldo Aman dihitung ulang tiap saat',
    body: 'Total saldo dikurangi kantong Tagihan, Tabungan, Dana Darurat, dan Target Tabungan.',
  },
  {
    icon: 'bolt',
    title: 'Setiap pembelian dibandingkan',
    body: 'Sebelum transaksi disimpan, nominalnya dibandingkan dengan Saldo Aman saat itu.',
  },
  {
    icon: 'shield',
    title: 'Kalau melewatinya, kami beri jeda',
    body: 'Muncul penjelasan singkat, lalu kamu memilih lanjut atau batalkan. Bukan pemblokiran.',
  },
]
</script>

<template>
  <main class="page">
    <PageHeader title="HoldUp!" subtitle="Saldo Aman dan cara kerjanya" />

    <div class="stack">
      <SafeBalanceCard />

      <section class="card" aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading" class="section-title">Perhitungan Saldo Aman</h2>
        <dl class="breakdown">
          <div v-for="row in rows" :key="row.key" class="breakdown__row">
            <dt>{{ row.label }}</dt>
            <dd class="tnum" :class="{ 'breakdown__value--deduct': row.kind === 'deduction' }">
              <span v-if="row.kind === 'deduction'" aria-hidden="true">−</span>{{ row.valueText }}
            </dd>
          </div>
          <div class="breakdown__row breakdown__row--result">
            <dt>Saldo Aman</dt>
            <dd class="tnum" :class="{ 'is-negative': isOverdrawn }">
              {{ amountsHidden ? 'Rp••••' : formatRupiah(safeBalance) }}
            </dd>
          </div>
        </dl>
        <p class="breakdown__formula">
          Saldo Aman = Total Saldo − Tagihan − Tabungan − Dana Darurat − Target Tabungan
        </p>
        <p class="breakdown__note">
          Dana misi tabungan ({{ formatRupiah(totalSaved) }}) sudah ada di kantong Tabungan, jadi
          tidak dihitung dua kali.
        </p>
        <div class="breakdown__actions">
          <button type="button" class="btn btn--primary btn--block" @click="openBalance">
            Atur Saldo &amp; Kantong
          </button>
          <button type="button" class="btn btn--ghost btn--block" @click="openBreakdown">
            Rincian lengkap
          </button>
        </div>
      </section>

      <section class="card" aria-labelledby="allowance-heading">
        <h2 id="allowance-heading" class="section-title">Jatah harian</h2>
        <p class="allowance__lead">
          Jatah dihitung dari Saldo Aman dibagi sisa hari bulan ini, termasuk hari ini.
        </p>
        <DailyAllowance
          class="allowance__component"
          tone="plain"
          :amount="dailyAllowance"
          :remaining-days="remainingDays"
          :is-overdrawn="isOverdrawn"
          :month-label="monthNameLong()"
          :hidden="amountsHidden"
        />
      </section>

      <div class="notice" :class="isOverdrawn ? 'notice--warn' : 'notice--info'" role="status">
        <AppIcon :name="isOverdrawn ? 'alert' : 'info'" :size="17" />
        <span>{{ status.message }}</span>
      </div>

      <section class="card" aria-labelledby="how-heading">
        <h2 id="how-heading" class="section-title">Cara kerja HoldUp!</h2>
        <ol class="steps">
          <li v-for="(step, index) in steps" :key="step.title" class="steps__item">
            <span class="steps__icon" aria-hidden="true">
              <AppIcon :name="step.icon" :size="17" />
            </span>
            <div>
              <p class="steps__title">{{ index + 1 }}. {{ step.title }}</p>
              <p class="steps__body">{{ step.body }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="actions" aria-label="Aksi HoldUp">
        <button type="button" class="btn btn--primary btn--block" @click="openEntry()">
          <AppIcon name="bolt" :size="17" />
          Coba simulasi pembelian
        </button>
        <button type="button" class="btn btn--ghost btn--block" @click="router.push('/misi')">
          Lihat misi tabungan
        </button>
      </section>

      <p class="detail__note">
        HoldUp! tidak pernah memblokir transaksi. Keputusan tetap ada di tangan kamu.
      </p>
    </div>
  </main>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 14px;
  padding-bottom: 10px;
}

.breakdown {
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
}

.breakdown__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13.5px;
}

.breakdown__row dt {
  color: var(--ink-2);
}

.breakdown__row dd {
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.breakdown__value--deduct {
  color: var(--ink-2);
}

.breakdown__row--result {
  border-bottom: 0;
  padding-top: 12px;
}

.breakdown__row--result dt,
.breakdown__row--result dd {
  font-size: 16px;
  color: var(--brand);
  font-weight: 750;
}

.is-negative {
  color: var(--brand) !important;
}

.breakdown__formula {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  background: var(--surface-2);
  border: 1px dashed var(--line-strong);
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ink-2);
}

.breakdown__note {
  margin-top: 10px;
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}

.breakdown__actions {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 14px;
}

.allowance__lead {
  margin-top: 6px;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.5;
}

.allowance__component {
  margin-top: 14px;
  padding-top: 13px;
  border-top: 1px solid var(--line);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-top: 12px;
}

.steps__item {
  display: flex;
  gap: 11px;
}

.steps__icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--brand-tint);
  color: var(--brand);
  flex: none;
}

.steps__title {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.steps__body {
  font-size: 12.5px;
  color: var(--ink-2);
  line-height: 1.5;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.detail__note {
  font-size: 12px;
  color: var(--ink-3);
  text-align: center;
  line-height: 1.5;
}
</style>
