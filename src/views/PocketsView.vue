<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import { formatRupiah } from '@/utils/format'
import { useFinanceStore } from '@/stores/finance'
import { useMissionsStore } from '@/stores/missions'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * Halaman ini hanya menampilkan hasil perhitungan. Semua pengeditan terjadi di
 * sheet “Atur Saldo”, jadi tidak ada dua formulir yang bisa saling bertentangan.
 */
const finance = useFinanceStore()
const missions = useMissionsStore()
const { safeBalanceBreakdown, safeBalance, isOverdrawn, amountsHidden, totalAllocated } =
  storeToRefs(finance)
const { totalSaved, unallocatedSavings, savingsPocketShortfall } = storeToRefs(missions)
const { openBalance, openBreakdown } = useMoneySheets()

const rows = computed(() =>
  safeBalanceBreakdown.value.map((row) => ({
    ...row,
    valueText: amountsHidden.value ? 'Rp••••' : formatRupiah(row.value),
  })),
)

const safeText = computed(() =>
  amountsHidden.value ? 'Rp••••' : formatRupiah(safeBalance.value),
)
const allocatedText = computed(() =>
  amountsHidden.value ? 'Rp••••' : formatRupiah(totalAllocated.value),
)
</script>

<template>
  <main class="page">
    <PageHeader title="Kantong & Saldo" subtitle="Dari mana angka Saldo Aman berasal" />

    <section class="card breakdown" aria-labelledby="breakdown-heading">
      <h2 id="breakdown-heading" class="section-title">Perhitungan Saldo Aman</h2>

      <dl class="rows">
        <div v-for="row in rows" :key="row.key" class="rows__item">
          <dt>{{ row.label }}</dt>
          <dd class="tnum" :class="{ 'rows__value--deduct': row.kind === 'deduction' }">
            <span v-if="row.kind === 'deduction'" aria-hidden="true">−</span>{{ row.valueText }}
          </dd>
        </div>
        <div class="rows__item rows__item--result">
          <dt>Saldo Aman</dt>
          <dd class="tnum" :class="{ 'is-negative': isOverdrawn }">{{ safeText }}</dd>
        </div>
      </dl>

      <p class="breakdown__total">
        Total disisihkan {{ allocatedText }} dari total saldo kamu.
      </p>

      <button type="button" class="btn btn--primary btn--block" @click="openBalance">
        <AppIcon name="settings" :size="17" />
        Atur Saldo &amp; Kantong
      </button>
      <button type="button" class="btn btn--ghost btn--block" @click="openBreakdown">
        Lihat rincian singkat
      </button>
    </section>

    <section class="card notes" aria-labelledby="notes-heading">
      <h2 id="notes-heading" class="section-title">Cara kami menghitung</h2>
      <ul class="notes__list">
        <li>
          <AppIcon name="info" :size="16" />
          <span>
            Saldo Aman = Total Saldo − Tagihan − Tabungan − Dana Darurat − Target Tabungan.
            Semuanya dihitung ulang setiap kali kamu menyimpan perubahan.
          </span>
        </li>
        <li>
          <AppIcon name="target" :size="16" />
          <span>
            Target Tabungan adalah nominal sisihan tambahan bulan ini. Berbeda dari target
            jangka panjang misi yang tidak mengurangi saldo sekaligus.
          </span>
        </li>
        <li>
          <AppIcon name="flag" :size="16" />
          <span>
            Dana misi tabungan ({{ formatRupiah(totalSaved) }}) berada di kantong Tabungan, jadi
            hanya dihitung satu kali. Sisa
            {{ formatRupiah(unallocatedSavings) }} di kantong itu belum ditugaskan ke misi.
          </span>
        </li>
        <li>
          <AppIcon name="shield" :size="16" />
          <span>
            Kantong bukan rekening terpisah dan tidak mengunci uangmu. Kamu selalu bisa memakai
            saldo untuk bertransaksi.
          </span>
        </li>
      </ul>

      <p v-if="savingsPocketShortfall > 0" class="notice notice--warn" role="status">
        <AppIcon name="alert" :size="17" />
        <span>
          Kantong Tabungan lebih kecil dari total dana misi sebesar
          {{ formatRupiah(savingsPocketShortfall) }}. Angka tetap ditampilkan apa adanya.
        </span>
      </p>
    </section>

    <p class="page-note">
      Demo prototipe: setiap perubahan langsung tersimpan di IndexedDB perangkat ini.
    </p>
  </main>
</template>

<style scoped>
.breakdown,
.notes {
  margin: 14px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rows {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.rows__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  font-size: 13.5px;
}

.rows__item dt {
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

.rows__item--result {
  border-bottom: 0;
  padding-top: 13px;
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

.breakdown__total {
  font-size: 12.5px;
  color: var(--ink-3);
  line-height: 1.5;
}

.notes__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notes__list li {
  display: flex;
  gap: 9px;
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-2);
}

.notice {
  margin-top: 2px;
}

.page-note {
  margin: 16px 0 4px;
  font-size: 11.5px;
  color: var(--ink-3);
  text-align: center;
  line-height: 1.5;
}
</style>
