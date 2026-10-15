<script setup>
import AppIcon from './AppIcon.vue'
import { useExpenseFlow } from '@/composables/useExpenseFlow'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * Maksimal empat pintasan, dan dua di antaranya adalah aksi inti HoldUp!:
 * mencatat pengeluaran dan mengatur saldo.
 */
const { openEntry } = useExpenseFlow()
const { openBalance } = useMoneySheets()
</script>

<template>
  <section aria-labelledby="quick-actions-heading">
    <h2 id="quick-actions-heading" class="sr-only">Aksi cepat</h2>
    <ul class="quick">
      <li>
        <button type="button" class="quick__item" @click="openEntry()">
          <span class="quick__icon" aria-hidden="true">
            <AppIcon name="bolt" :size="19" />
          </span>
          <span class="quick__label">Catat pengeluaran</span>
        </button>
      </li>
      <li>
        <button type="button" class="quick__item" @click="openBalance">
          <span class="quick__icon" aria-hidden="true">
            <AppIcon name="wallet" :size="19" />
          </span>
          <span class="quick__label">Atur saldo</span>
        </button>
      </li>
      <li>
        <RouterLink to="/topup" class="quick__item">
          <span class="quick__icon" aria-hidden="true">
            <AppIcon name="plus" :size="19" />
          </span>
          <span class="quick__label">Top Up</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/layanan" class="quick__item">
          <span class="quick__icon" aria-hidden="true">
            <AppIcon name="grid" :size="19" />
          </span>
          <span class="quick__label">Semua layanan</span>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.quick {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 4px 0;
}

.quick__item {
  width: 100%;
  min-height: 74px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding: 4px 2px;
  border: 0;
  border-radius: var(--r-md);
  background: transparent;
  transition: background-color var(--dur-fast) var(--ease);
}

.quick__item:hover {
  background: var(--surface-2);
}

.quick__icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
}

.quick__label {
  font-size: 11.5px;
  font-weight: 600;
  text-align: center;
  line-height: 1.25;
  color: var(--ink-2);
}
</style>
