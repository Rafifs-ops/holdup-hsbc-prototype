<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/PageHeader.vue'
import RecentTransactions from '@/components/RecentTransactions.vue'
import { useFinanceStore } from '@/stores/finance'

/**
 * Riwayat lengkap dari IndexedDB. Setiap pengeluaran, pemasukan, dan perubahan
 * alokasi tercatat di sini sehingga perubahan saldo bisa ditelusuri.
 */
const finance = useFinanceStore()
const { transactions } = storeToRefs(finance)

const filters = [
  { value: 'all', label: 'Semua' },
  { value: 'out', label: 'Pengeluaran' },
  { value: 'in', label: 'Pemasukan' },
  { value: 'internal', label: 'Alokasi' },
]

const activeFilter = ref('all')

const filtered = computed(() => {
  if (activeFilter.value === 'all') return transactions.value
  return transactions.value.filter((item) => item.direction === activeFilter.value)
})

const totalText = computed(() => `${filtered.value.length} transaksi`)
</script>

<template>
  <main class="page">
    <PageHeader title="Aktivitas" subtitle="Semua transaksi simulasi kamu" />

    <div class="filters" role="group" aria-label="Filter jenis transaksi">
      <button
        v-for="filter in filters"
        :key="filter.value"
        type="button"
        class="chip"
        :class="{ 'chip--active': activeFilter === filter.value }"
        :aria-pressed="activeFilter === filter.value"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <p class="activity__count">{{ totalText }}</p>

    <RecentTransactions
      :source="filtered"
      :limit="filtered.length || 1"
      :show-header="false"
    />

    <p class="activity__note">
      Riwayat ini tersimpan di perangkat kamu lewat IndexedDB dan tetap ada setelah halaman
      ditutup.
    </p>
  </main>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin: 14px 0 10px;
}

.chip {
  min-height: 40px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 600;
}

.chip:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.chip--active {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}

.activity__count {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--ink-3);
}

.activity__note {
  margin: 14px 0 4px;
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}
</style>
