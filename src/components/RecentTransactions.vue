<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import { categoryMeta } from '@/utils/categories'
import { formatRupiah, formatSignedRupiah } from '@/utils/format'
import { formatDateShort } from '@/utils/date'
import { useFinanceStore } from '@/stores/finance'

const props = defineProps({
  /** Jumlah item yang ditampilkan. */
  limit: { type: Number, default: 3 },
  showHeader: { type: Boolean, default: true },
  /** Daftar alternatif (dipakai filter di halaman Aktivitas). */
  source: { type: Array, default: null },
})

const finance = useFinanceStore()
const { transactions, amountsHidden } = storeToRefs(finance)

const TYPE_LABEL = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
  allocation: 'Alokasi',
}

const items = computed(() =>
  (props.source || transactions.value).slice(0, props.limit).map((transaction) => {
    const meta = categoryMeta(transaction.category)
    const isIncome = transaction.direction === 'in'
    const isAllocation = transaction.type === 'allocation'

    let amountText = 'Rp••••'
    if (!amountsHidden.value) {
      if (isAllocation) amountText = formatRupiah(transaction.amount)
      else amountText = formatSignedRupiah(isIncome ? transaction.amount : -transaction.amount)
    }

    return {
      ...transaction,
      categoryLabel: meta.label,
      icon: isAllocation ? 'target' : meta.icon,
      amountText,
      dateText: formatDateShort(transaction.date),
      isIncome,
      isAllocation,
      typeLabel: TYPE_LABEL[transaction.type] || 'Transaksi',
    }
  }),
)
</script>

<template>
  <section aria-labelledby="recent-heading">
    <div v-if="showHeader" class="section-head">
      <h2 id="recent-heading" class="section-title">Aktivitas terbaru</h2>
      <RouterLink to="/aktivitas" class="section-link">
        Lihat semua
        <AppIcon name="chevronRight" :size="15" />
      </RouterLink>
    </div>

    <ul class="tx card card--flush">
      <li v-for="item in items" :key="item.id" class="tx__row">
        <span
          class="tx__icon"
          :class="{ 'tx__icon--in': item.isIncome, 'tx__icon--alloc': item.isAllocation }"
          aria-hidden="true"
        >
          <AppIcon :name="item.icon" :size="17" />
        </span>
        <div class="tx__main">
          <p class="tx__name">{{ item.name }}</p>
          <p class="tx__meta">
            {{ item.dateText }} • {{ item.isAllocation ? item.typeLabel : item.categoryLabel }}
          </p>
        </div>
        <p
          class="tx__amount tnum"
          :class="{ 'tx__amount--in': item.isIncome, 'tx__amount--alloc': item.isAllocation }"
        >
          {{ item.amountText }}
        </p>
      </li>
      <li v-if="!items.length" class="tx__empty">Belum ada aktivitas pada periode ini.</li>
    </ul>
  </section>
</template>

<style scoped>
.tx__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
}

.tx__row:last-child {
  border-bottom: 0;
}

.tx__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--surface-2);
  color: var(--ink-2);
  flex: none;
}

.tx__icon--in {
  background: var(--positive-tint);
  color: var(--positive);
}

.tx__icon--alloc {
  background: var(--brand-tint);
  color: var(--brand-deep);
}

.tx__main {
  flex: 1;
  min-width: 0;
}

.tx__name {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx__meta {
  font-size: 12px;
  color: var(--ink-3);
}

.tx__amount {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.tx__amount--in {
  color: var(--positive);
}

.tx__amount--alloc {
  color: var(--ink-2);
}

.tx__empty {
  padding: 22px 16px;
  text-align: center;
  font-size: 13.5px;
  color: var(--ink-3);
}
</style>
