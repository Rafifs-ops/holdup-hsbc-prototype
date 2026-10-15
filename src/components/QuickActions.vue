<script setup>
import AppIcon from './AppIcon.vue'

/**
 * Pintasan perbankan pada dashboard: Transfer, Bayar, Top Up, dan Lainnya.
 * Ukuran ikon dan label seragam supaya terbaca cepat, tanpa mengalahkan
 * card Saldo Aman di atasnya.
 */
const actions = [
  { label: 'Transfer', icon: 'send', to: '/transfer' },
  { label: 'Bayar', icon: 'card', to: '/bayar' },
  { label: 'Top Up', icon: 'plus', to: '/topup' },
  { label: 'Lainnya', icon: 'grid', to: '/layanan' },
]
</script>

<template>
  <section aria-labelledby="quick-actions-heading">
    <h2 id="quick-actions-heading" class="sr-only">Aksi cepat</h2>
    <ul class="quick">
      <li v-for="action in actions" :key="action.to">
        <RouterLink :to="action.to" class="quick__item">
          <span class="quick__icon" aria-hidden="true">
            <AppIcon :name="action.icon" :size="19" />
          </span>
          <span class="quick__label">{{ action.label }}</span>
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
