<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import { formatRupiah } from '@/utils/format'
import { useFinanceStore } from '@/stores/finance'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * Total saldo sengaja dibuat sebagai baris sekunder yang ringkas supaya
 * perhatian tetap jatuh ke Saldo Aman.
 */
const finance = useFinanceStore()
const { totalBalance, amountsHidden } = storeToRefs(finance)
const { openBalance } = useMoneySheets()

const amountText = computed(() =>
  amountsHidden.value ? 'Rp•••••••' : formatRupiah(totalBalance.value),
)
const toggleLabel = computed(() =>
  amountsHidden.value ? 'Tampilkan nominal saldo' : 'Sembunyikan nominal saldo',
)
</script>

<template>
  <section class="account" aria-labelledby="total-balance-label">
    <div class="account__main">
      <p id="total-balance-label" class="account__label">Total Saldo</p>
      <p class="account__amount tnum">{{ amountText }}</p>
    </div>

    <div class="account__actions">
      <button type="button" class="account__small" @click="openBalance">Atur Saldo</button>
      <button
        type="button"
        class="account__toggle"
        :aria-pressed="amountsHidden"
        :aria-label="toggleLabel"
        @click="finance.toggleAmounts()"
      >
        <AppIcon :name="amountsHidden ? 'eyeOff' : 'eye'" :size="18" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
}

.account__main {
  min-width: 0;
}

.account__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
}

.account__amount {
  margin-top: 1px;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.account__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: none;
}

.account__small {
  min-height: 36px;
  padding: 0 12px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 12.5px;
  font-weight: 650;
}

.account__small:hover {
  background: var(--surface-2);
  border-color: var(--ink-3);
}

.account__toggle {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--ink-2);
}

.account__toggle:hover {
  background: var(--surface-2);
  color: var(--ink);
}
</style>
