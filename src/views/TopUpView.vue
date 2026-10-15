<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import AmountField from '@/components/AmountField.vue'
import { formatRupiah } from '@/utils/format'
import { useFinanceStore } from '@/stores/finance'
import { useUiStore } from '@/stores/ui'

/**
 * Pemasukan juga dicatat sebagai transaksi supaya setiap perubahan saldo bisa
 * ditelusuri lewat halaman Aktivitas.
 */
const finance = useFinanceStore()
const ui = useUiStore()
const router = useRouter()
const { totalBalance, amountsHidden, dailyAllowance } = storeToRefs(finance)

const amount = ref(0)
const error = ref('')
const saving = ref(false)

const quickAmounts = [100_000, 250_000, 500_000, 1_000_000]
const balanceText = computed(() =>
  amountsHidden.value ? 'Rp••••' : formatRupiah(totalBalance.value),
)

async function submit() {
  const value = Math.round(Number(amount.value) || 0)
  if (value <= 0) {
    error.value = 'Nominal top up harus lebih besar dari Rp0.'
    return
  }

  error.value = ''
  saving.value = true
  try {
    const result = await finance.recordIncome({ name: 'Top up saldo', amount: value })
    if (!result.ok) {
      error.value = result.error
      return
    }
    ui.pushToast(`${formatRupiah(value)} ditambahkan ke total saldo kamu.`)
    router.push('/')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="page">
    <PageHeader title="Top Up" subtitle="Tambah saldo simulasi kamu" />

    <section class="card" aria-labelledby="topup-heading">
      <h2 id="topup-heading" class="section-title">Nominal top up</h2>
      <p class="lead">
        Top up menambah total saldo, dan karena Saldo Aman dihitung ulang, jatah harian kamu ikut
        naik. Transaksinya tercatat di Aktivitas.
      </p>

      <AmountField
        v-model="amount"
        input-id="topup-amount"
        label="Nominal"
        :error="error"
        hint="Masukkan nominal tanpa titik."
        autofocus
        @submit="submit"
      />

      <div class="chips">
        <button
          v-for="value in quickAmounts"
          :key="value"
          type="button"
          class="chip"
          :class="{ 'chip--active': amount === value }"
          @click="amount = value; error = ''"
        >
          {{ formatRupiah(value) }}
        </button>
      </div>

      <dl class="summary">
        <div class="summary__row">
          <dt>Total saldo sekarang</dt>
          <dd class="tnum">{{ balanceText }}</dd>
        </div>
        <div class="summary__row">
          <dt>Jatah harian sekarang</dt>
          <dd class="tnum">{{ formatRupiah(dailyAllowance) }} / hari</dd>
        </div>
      </dl>

      <button
        type="button"
        class="btn btn--primary btn--block"
        :disabled="saving"
        @click="submit"
      >
        {{ saving ? 'Menyimpan…' : 'Top up sekarang' }}
      </button>

      <p class="note">
        <AppIcon name="info" :size="16" />
        <span>Prototipe: tidak ada dana sungguhan yang masuk.</span>
      </p>
    </section>
  </main>
</template>

<style scoped>
.card {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.lead {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  min-height: 38px;
  padding: 0 12px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 600;
}

.chip:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.chip--active {
  background: var(--brand-tint);
  border-color: var(--brand);
  color: var(--brand-deep);
}

.summary {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 14px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.summary__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13.5px;
}

.summary__row dt {
  color: var(--ink-2);
}

.summary__row dd {
  margin: 0;
  font-weight: 700;
}

.note {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}
</style>
