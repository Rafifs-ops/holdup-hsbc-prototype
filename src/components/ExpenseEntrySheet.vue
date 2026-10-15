<script setup>
import { computed, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import BaseSheet from './BaseSheet.vue'
import AmountField from './AmountField.vue'
import { CATEGORIES } from '@/utils/categories'
import { formatRupiah, validateAmountInput } from '@/utils/format'
import { useFinanceStore } from '@/stores/finance'

const props = defineProps({
  open: { type: Boolean, default: false },
  prefill: { type: Object, default: null },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'submit'])

const finance = useFinanceStore()

const name = ref('')
const amount = ref(0)
const category = ref('belanja')
const touched = ref(false)
const nameError = ref('')
const amountError = ref('')
const nameInput = ref(null)

const QUICK_AMOUNTS = [50_000, 100_000, 250_000, 500_000]
const MAX_AMOUNT = 50_000_000

const safeBefore = computed(() => finance.safeBalance)
const safeAfter = computed(() => safeBefore.value - amount.value)
const willCrossSafe = computed(() => amount.value > safeBefore.value && amount.value > 0)

const previewNote = computed(() => {
  if (amount.value <= 0) return `Saldo Aman saat ini ${formatRupiah(safeBefore.value)}.`
  if (willCrossSafe.value) {
    return `Pembelian ini melewati Saldo Aman kamu sebesar ${formatRupiah(amount.value - safeBefore.value)}.`
  }
  return `Sisa Saldo Aman setelah pembelian ${formatRupiah(safeAfter.value)}.`
})

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    name.value = props.prefill?.name || ''
    amount.value = Number(props.prefill?.amount) || 0
    category.value = props.prefill?.category || 'belanja'
    touched.value = false
    nameError.value = ''
    amountError.value = ''
  },
  { immediate: true },
)

function validate() {
  touched.value = true
  nameError.value = name.value.trim().length < 2 ? 'Nama pengeluaran minimal 2 karakter.' : ''
  const result = validateAmountInput(amount.value, {
    label: 'Nominal',
    min: 1_000,
    max: MAX_AMOUNT,
  })
  amountError.value = result.valid ? '' : result.error
  return !nameError.value && !amountError.value
}

function submit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    amount: Math.round(amount.value),
    category: category.value,
  })
}

function pickQuickAmount(value) {
  amount.value = value
  amountError.value = ''
}
</script>

<template>
  <BaseSheet
    :open="open"
    title="Pengeluaran baru"
    subtitle="Simulasi pembelian untuk mencoba HoldUp!."
    size="tall"
    @close="emit('close')"
  >
    <form class="expense-form" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="field-label" for="expense-name">Nama pengeluaran</label>
        <input
          id="expense-name"
          ref="nameInput"
          v-model="name"
          class="control"
          type="text"
          placeholder="Contoh: Sepatu lari"
          autocomplete="off"
          data-autofocus
          :aria-invalid="nameError ? 'true' : 'false'"
          :aria-describedby="nameError ? 'expense-name-error' : undefined"
        >
        <p v-if="nameError" id="expense-name-error" class="field-error" role="alert">
          <span aria-hidden="true">•</span>{{ nameError }}
        </p>
      </div>

      <AmountField
        v-model="amount"
        input-id="expense-amount"
        label="Nominal pengeluaran"
        :error="amountError"
        hint="Masukkan nominal tanpa tanda titik."
        placeholder="0"
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

      <fieldset class="field categories">
        <legend class="field-label">Kategori</legend>
        <div class="chips">
          <button
            v-for="item in CATEGORIES"
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

      <div class="preview" :class="{ 'preview--warn': willCrossSafe }">
        <div class="preview__row">
          <span>Saldo Aman saat ini</span>
          <strong class="tnum">{{ formatRupiah(safeBefore) }}</strong>
        </div>
        <div class="preview__row">
          <span>Saldo Aman setelah pembelian</span>
          <strong class="tnum" :class="{ 'preview__value--warn': willCrossSafe }">
            {{ formatRupiah(safeAfter) }}
          </strong>
        </div>
        <p class="preview__note">
          <AppIcon :name="willCrossSafe ? 'alert' : 'info'" :size="15" />
          {{ previewNote }}
        </p>
      </div>        <p class="disclaimer">
        Semua transaksi di prototipe ini hanya simulasi. Tidak ada uang yang benar-benar keluar.
      </p>
    </form>

    <template #footer>
      <button
        type="button"
        class="btn btn--primary btn--block"
        :disabled="busy"
        @click="submit"
      >
        {{ busy ? 'Menyimpan…' : 'Lanjutkan' }}
      </button>
      <button type="button" class="btn btn--ghost btn--block" @click="emit('close')">
        Batal
      </button>
    </template>
  </BaseSheet>
</template>

<style scoped>
.expense-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 4px;
}

.categories {
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

.preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 13px 14px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.preview--warn {
  background: var(--brand-tint);
  border-color: var(--brand-tint-strong);
}

.preview__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13.5px;
  color: var(--ink-2);
}

.preview__row strong {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.preview__value--warn {
  color: var(--brand-deep) !important;
}

.preview__note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  font-size: 12.5px;
  line-height: 1.45;
  color: var(--ink-2);
}

.preview--warn .preview__note {
  color: var(--brand-deep);
}

.disclaimer {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.45;
}
</style>
