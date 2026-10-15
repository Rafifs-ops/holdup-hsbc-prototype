<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'
import AmountField from '@/components/AmountField.vue'
import HoldUpWarningSheet from '@/components/HoldUpWarningSheet.vue'
import { PAYMENT_CATEGORIES } from '@/utils/categories'
import { computeRoundUp } from '@/utils/roundup'
import { dailyAllowanceFor, resolveSafeStatus } from '@/utils/safeStatus'
import { formatRupiah, validateAmountInput } from '@/utils/format'
import { useFinanceStore } from '@/stores/finance'
import { useUiStore } from '@/stores/ui'

/**
 * Halaman Bayar. Alurnya: pilih kategori, isi deskripsi + nominal, lihat
 * rincian (termasuk pembulatan bila aktif), lalu konfirmasi.
 *
 *  - Pembayaran yang tidak melewati Saldo Aman langsung disimpan.
 *  - Pembayaran yang berpotensi membuat Saldo Aman negatif diberi jeda HoldUp!,
 *    dan pengguna tetap boleh melanjutkan.
 *
 * Semua pembulatan memakai computeRoundUp() sehingga tidak ada perhitungan yang
 * berbeda antara pratinjau dan penyimpanan.
 */
const finance = useFinanceStore()
const ui = useUiStore()
const router = useRouter()

const { safeBalance, autoRoundupEnabled, remainingDays, dailyAllowance } = storeToRefs(finance)

const QUICK_AMOUNTS = [20_000, 50_000, 100_000, 250_000, 500_000]
const MAX_AMOUNT = 50_000_000

const description = ref('')
const amount = ref(0)
const category = ref('belanja')
const descError = ref('')
const amountError = ref('')
const busy = ref(false)
const warningOpen = ref(false)
const pending = ref(null)

const safeBefore = computed(() => safeBalance.value)

/** Selisih pembulatan hanya berlaku kalau fitur aktif. */
const roundUp = computed(() =>
  autoRoundupEnabled.value ? computeRoundUp(amount.value).roundUpSavings : 0,
)
const totalDeduction = computed(() => amount.value + roundUp.value)
const willCrossSafe = computed(() => amount.value > 0 && totalDeduction.value > safeBefore.value)
const safeAfter = computed(() => safeBefore.value - totalDeduction.value)

/** Estimasi status Saldo Aman setelah pembayaran (termasuk pembulatan). */
const currentStatus = computed(() =>
  resolveSafeStatus({ safeBalance: safeBefore.value, dailyAllowance: dailyAllowance.value }),
)
const projectedStatus = computed(() =>
  resolveSafeStatus({
    safeBalance: safeAfter.value,
    dailyAllowance: dailyAllowanceFor(safeAfter.value, remainingDays.value),
  }),
)
const statusWillChange = computed(() => projectedStatus.value.key !== currentStatus.value.key)

const ctaLabel = computed(() => {
  if (busy.value) return 'Memproses…'
  if (amount.value <= 0) return 'Bayar'
  return `Bayar ${formatRupiah(totalDeduction.value)}`
})

function validate() {
  descError.value =
    description.value.trim().length < 2 ? 'Isi nama atau deskripsi pembayaran minimal 2 karakter.' : ''
  const result = validateAmountInput(amount.value, {
    label: 'Nominal pembayaran',
    min: 1_000,
    max: MAX_AMOUNT,
  })
  amountError.value = result.valid ? '' : result.error
  return !descError.value && !amountError.value
}

function pickQuickAmount(value) {
  amount.value = value
  amountError.value = ''
}

function submit() {
  if (busy.value) return
  if (!validate()) return

  const payment = {
    name: description.value.trim(),
    amount: Math.round(amount.value),
    category: category.value,
    roundUp: roundUp.value,
    total: totalDeduction.value,
    safeBefore: safeBefore.value,
    safeAfter: safeAfter.value,
    shortfall: Math.max(0, totalDeduction.value - safeBefore.value),
    projectedStatus: projectedStatus.value,
  }

  if (willCrossSafe.value) {
    pending.value = payment
    warningOpen.value = true
    return
  }
  commit(payment)
}

async function commit(payment) {
  busy.value = true
  try {
    const result = await finance.recordPayment({
      name: payment.name,
      amount: payment.amount,
      category: payment.category,
    })

    if (!result.ok) {
      ui.pushToast(result.error, { tone: 'warn' })
      return
    }

    // Pesan tabungan otomatis hanya muncul kalau penyimpanan benar-benar selesai
    // dan selisihnya lebih dari nol.
    if (result.roundUp > 0) {
      ui.pushToast(
        `Pembayaran berhasil. ${formatRupiah(result.roundUp)} berhasil disisihkan ke Tabungan.`,
        { duration: 4200 },
      )
    } else {
      ui.pushToast(`Pembayaran ${formatRupiah(payment.amount)} berhasil.`)
    }

    if (result.safeAfter < 0) {
      ui.pushToast('Saldo Aman kamu sekarang minus. Kamu tetap bisa bertransaksi.', {
        tone: 'warn',
        duration: 4400,
      })
    }

    pending.value = null
    router.push('/')
  } catch (err) {
    console.error('[HoldUp!] gagal menyimpan pembayaran:', err)
    ui.pushToast('Pembayaran gagal disimpan. Saldo kamu tidak berubah.', {
      tone: 'warn',
      duration: 4400,
    })
  } finally {
    busy.value = false
  }
}

/** “Saya paham, lanjutkan” dari jeda HoldUp!. */
function confirmPayment() {
  const payment = pending.value
  warningOpen.value = false
  if (!payment) return
  return commit(payment)
}

/** “Batalkan” — tidak ada satu pun data yang berubah. */
function cancelPayment() {
  warningOpen.value = false
  pending.value = null
  ui.pushToast('Pembayaran dibatalkan. Saldo kamu tidak berubah.', { tone: 'neutral' })
}

function closeWarning() {
  warningOpen.value = false
  pending.value = null
}
</script>

<template>
  <main class="page pay">
    <PageHeader title="Bayar" subtitle="Bayar tagihan dan merchant" back-to="/" />

    <form class="pay__form" novalidate @submit.prevent="submit">
      <fieldset class="field">
        <legend class="field-label">Jenis pembayaran</legend>
        <div class="chips">
          <button
            v-for="item in PAYMENT_CATEGORIES"
            :key="item.value"
            type="button"
            class="chip chip--icon"
            :class="{ 'chip--active': category === item.value }"
            :aria-pressed="category === item.value"
            @click="category = item.value"
          >
            <AppIcon :name="item.icon" :size="15" />
            {{ item.label }}
          </button>
        </div>
      </fieldset>

      <div class="field">
        <label class="field-label" for="pay-name">Nama atau deskripsi pembayaran</label>
        <input
          id="pay-name"
          v-model="description"
          class="control"
          type="text"
          placeholder="Contoh: Tagihan listrik"
          autocomplete="off"
          :aria-invalid="descError ? 'true' : 'false'"
          :aria-describedby="descError ? 'pay-name-error' : undefined"
        >
        <p v-if="descError" id="pay-name-error" class="field-error" role="alert">
          <span aria-hidden="true">•</span>{{ descError }}
        </p>
      </div>

      <AmountField
        v-model="amount"
        input-id="pay-amount"
        label="Nominal pembayaran"
        :error="amountError"
        hint="Masukkan nominal tanpa tanda titik."
        @submit="submit"
      />

      <div class="chips" role="group" aria-label="Nominal cepat">
        <button
          v-for="value in QUICK_AMOUNTS"
          :key="value"
          type="button"
          class="chip"
          :class="{ 'chip--active': amount === value }"
          @click="pickQuickAmount(value)"
        >
          {{ formatRupiah(value) }}
        </button>
      </div>

      <section v-if="amount > 0" class="summary" aria-label="Rincian pembayaran">
        <div class="summary__row">
          <span>Pembayaran</span>
          <strong class="tnum">{{ formatRupiah(amount) }}</strong>
        </div>

        <template v-if="autoRoundupEnabled && roundUp > 0">
          <div class="summary__row summary__row--save">
            <span>Pembulatan Otomatis</span>
            <strong class="tnum">+{{ formatRupiah(roundUp) }}</strong>
          </div>
          <div class="summary__row">
            <span>Ditabung otomatis</span>
            <strong class="tnum">{{ formatRupiah(roundUp) }}</strong>
          </div>
          <div class="summary__row summary__row--total">
            <span>Total dana yang dialokasikan</span>
            <strong class="tnum">{{ formatRupiah(totalDeduction) }}</strong>
          </div>
        </template>

        <p v-else-if="autoRoundupEnabled" class="summary__note">
          <AppIcon name="info" :size="15" />
          Nominal sudah kelipatan Rp1.000, jadi tidak ada pembulatan.
        </p>

        <div v-else class="summary__row summary__row--total">
          <span>Total dana yang dialokasikan</span>
          <strong class="tnum">{{ formatRupiah(amount) }}</strong>
        </div>
      </section>

      <section class="safe" :class="{ 'safe--warn': willCrossSafe }" aria-label="Dampak ke Saldo Aman">
        <div class="safe__row">
          <span>Saldo Aman saat ini</span>
          <strong class="tnum">{{ formatRupiah(safeBefore) }}</strong>
        </div>
        <div class="safe__row">
          <span>Saldo Aman setelah pembayaran</span>
          <strong class="tnum" :class="{ 'safe__value--warn': willCrossSafe }">
            {{ formatRupiah(safeAfter) }}
          </strong>
        </div>

        <div v-if="amount > 0" class="safe__status" :class="`safe__status--${projectedStatus.key}`">
          <span class="safe__status-label">Status setelah pembayaran</span>
          <span class="safe__status-chip">
            <AppIcon :name="projectedStatus.icon" :size="14" />
            {{ projectedStatus.label }}
          </span>
        </div>

        <p v-if="amount > 0 && statusWillChange" class="safe__note">
          <AppIcon :name="projectedStatus.icon" :size="15" />
          <span>
            Status Saldo Aman berubah dari {{ currentStatus.label }} menjadi
            {{ projectedStatus.label }}.
          </span>
        </p>
      </section>

      <p class="pay__disclaimer">
        Simulasi lokal: tidak ada uang sungguhan yang berpindah. Pembayaran tercatat sebesar
        nominal asli kepada merchant, sedangkan selisih pembulatan hanya dipindahkan ke Tabungan.
      </p>

      <div class="pay__cta">
        <button type="submit" class="btn btn--primary btn--block" :disabled="busy">
          {{ ctaLabel }}
        </button>
        <button type="button" class="btn btn--ghost btn--block" @click="router.push('/')">
          Batalkan
        </button>
      </div>
    </form>

    <HoldUpWarningSheet
      :open="warningOpen"
      :purchase="pending"
      :busy="busy"
      @confirm="confirmPayment"
      @cancel="cancelPayment"
      @close="closeWarning"
    />
  </main>
</template>

<style scoped>
.pay {
  display: flex;
  flex-direction: column;
}

.pay__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 14px;
  padding-bottom: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 0;
  padding: 0;
  margin: 0;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 13px;
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
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px;
  border-radius: var(--r-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
}

.summary__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13.5px;
  color: var(--ink-2);
}

.summary__row strong {
  color: var(--ink);
  font-weight: 700;
}

.summary__row--save strong {
  color: var(--positive);
}

.summary__row--total {
  margin-top: 2px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}

.summary__row--total strong {
  font-size: 16px;
}

.summary__note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--ink-3);
}

.safe {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 14px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.safe--warn {
  background: var(--brand-tint);
  border-color: var(--brand-tint-strong);
}

.safe__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: var(--ink-2);
}

.safe__row strong {
  color: var(--ink);
  font-weight: 700;
}

.safe__value--warn {
  color: var(--brand-deep) !important;
}

.safe__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 2px;
  padding-top: 11px;
  border-top: 1px solid var(--line);
}

.safe__status-label {
  font-size: 12.5px;
  color: var(--ink-2);
}

.safe__status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  font-size: 11.5px;
  font-weight: 700;
}

.safe__status--safe .safe__status-chip {
  background: var(--status-safe-tint);
  color: var(--status-safe-deep);
}

.safe__status--low .safe__status-chip {
  background: var(--status-low-tint);
  color: var(--status-low-deep);
}

.safe__status--over .safe__status-chip {
  background: var(--status-over-tint);
  color: var(--status-over-deep);
}

.safe__note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink-2);
}

.pay__disclaimer {
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink-3);
}

.pay__cta {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 2px;
}
</style>
