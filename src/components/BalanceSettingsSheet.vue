<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import BaseSheet from './BaseSheet.vue'
import AmountField from './AmountField.vue'
import { POCKET_DEFS, SAVINGS_TARGET_DEF } from '@/utils/pockets'
import { formatRupiah } from '@/utils/format'
import { useFinanceStore } from '@/stores/finance'
import { useMissionsStore } from '@/stores/missions'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * “Atur Saldo” — satu tempat untuk saldo simulasi dan seluruh alokasi.
 * Saldo Aman tidak diisi manual: hasilnya selalu dihitung dari field-field ini.
 */
const finance = useFinanceStore()
const missions = useMissionsStore()
const { totalBalance, billPocket, savingsPocket, emergencyPocket, savingsTarget } =
  storeToRefs(finance)
const { savingsPocketShortfall, totalSaved } = storeToRefs(missions)

const { balanceOpen, closeBalance, saveBalance } = useMoneySheets()

const draft = ref({
  totalBalance: 0,
  bill: 0,
  savings: 0,
  emergency: 0,
  savingsTarget: 0,
})
const totalError = ref('')
const saving = ref(false)

watch(
  () => balanceOpen.value,
  (open) => {
    if (!open) return
    draft.value = {
      totalBalance: totalBalance.value,
      bill: billPocket.value,
      savings: savingsPocket.value,
      emergency: emergencyPocket.value,
      savingsTarget: savingsTarget.value,
    }
    totalError.value = ''
  },
  { immediate: true },
)

const allocatedDraft = computed(
  () => draft.value.bill + draft.value.savings + draft.value.emergency + draft.value.savingsTarget,
)
const safeDraft = computed(() => draft.value.totalBalance - allocatedDraft.value)
const isOverAllocated = computed(() => safeDraft.value < 0)

const fields = computed(() => [
  ...POCKET_DEFS.map((def) => ({ ...def, key: def.key })),
  { ...SAVINGS_TARGET_DEF, key: 'savingsTarget' },
])

async function submit() {
  const total = Math.round(Number(draft.value.totalBalance) || 0)
  if (total <= 0) {
    totalError.value = 'Total saldo harus lebih besar dari Rp0.'
    return
  }
  totalError.value = ''
  saving.value = true
  try {
    await saveBalance({ ...draft.value, totalBalance: total })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <BaseSheet
    :open="balanceOpen"
    title="Atur Saldo"
    subtitle="Kamu sedang mengubah saldo simulasi, bukan rekening sungguhan."
    size="tall"
    @close="closeBalance"
  >
    <form class="form" novalidate @submit.prevent="submit">
      <AmountField
        v-model="draft.totalBalance"
        input-id="settings-total"
        label="Total saldo"
        :error="totalError"
        hint="Saldo simulasi yang kamu miliki saat ini."
        autofocus
      />

      <div class="group">
        <p class="group__title">Alokasi kantong</p>
        <p class="group__note">
          Kantong hanya menandai uang, tidak memindahkannya ke rekening lain. Saldo Aman
          berkurang sebesar dana yang kamu sisihkan.
        </p>

        <AmountField
          v-for="field in fields"
          :key="field.key"
          v-model="draft[field.key]"
          :input-id="`settings-${field.key}`"
          :label="field.label"
          size="regular"
          :hint="field.description"
        />
      </div>

      <div v-if="savingsPocketShortfall > 0" class="notice notice--warn" role="status">
        <AppIcon name="alert" :size="17" />
        <span>
          Kantong Tabungan ({{ formatRupiah(draft.savings) }}) lebih kecil dari dana misi
          ({{ formatRupiah(totalSaved) }}). Angka yang kamu masukkan tetap disimpan apa adanya,
          tetapi misinya akan terlihat belum sepenuhnya tertutup.
        </span>
      </div>

      <div class="summary" aria-label="Perhitungan Saldo Aman">
        <div class="summary__row">
          <span>Total saldo</span>
          <strong class="tnum">{{ formatRupiah(draft.totalBalance) }}</strong>
        </div>
        <div class="summary__row">
          <span>Total disisihkan</span>
          <strong class="tnum">−{{ formatRupiah(allocatedDraft) }}</strong>
        </div>
        <div class="summary__row summary__row--result">
          <span>Saldo Aman</span>
          <strong class="tnum" :class="{ 'is-negative': isOverAllocated }">
            {{ formatRupiah(safeDraft) }}
          </strong>
        </div>
      </div>

      <div v-if="isOverAllocated" class="notice notice--warn" role="status">
        <AppIcon name="alert" :size="17" />
        <span>
          Total alokasi melebihi saldo sebesar {{ formatRupiah(Math.abs(safeDraft)) }}. Saldo Aman
          akan minus — kamu tetap boleh menyimpan pengaturan ini.
        </span>
      </div>
    </form>

    <template #footer>
      <button type="button" class="btn btn--primary btn--block" :disabled="saving" @click="submit">
        {{ saving ? 'Menyimpan…' : 'Simpan' }}
      </button>
      <button type="button" class="btn btn--ghost btn--block" @click="closeBalance">Batal</button>
    </template>
  </BaseSheet>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-bottom: 6px;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.group__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.group__note {
  margin-top: -8px;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-3);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
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
  color: var(--ink-2);
}

.summary__row strong {
  color: var(--ink);
  font-weight: 700;
}

.summary__row--result {
  padding-top: 9px;
  border-top: 1px solid var(--line);
  font-weight: 650;
}

.summary__row--result strong {
  font-size: 19px;
  color: var(--brand);
}

.is-negative {
  color: var(--brand) !important;
}
</style>
