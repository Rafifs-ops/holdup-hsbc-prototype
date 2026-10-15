<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import BaseSheet from './BaseSheet.vue'
import { formatRupiah } from '@/utils/format'
import { useMoneySheets } from '@/composables/useMoneySheets'

/**
 * Jeda HoldUp!: satu sheet ringkas, tanpa modal bertumpuk dan tanpa langkah
 * konfirmasi tambahan. Pengguna tetap bebas melanjutkan pembelian.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  purchase: { type: Object, default: null },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const { openBreakdown } = useMoneySheets()

const rows = computed(() => {
  if (!props.purchase) return []
  return [
    { label: 'Pembelian', value: props.purchase.name },
    { label: 'Nominal', value: formatRupiah(props.purchase.amount) },
    { label: 'Saldo Aman saat ini', value: formatRupiah(props.purchase.safeBefore) },
    {
      label: 'Saldo Aman setelah pembelian',
      value: formatRupiah(props.purchase.safeAfter),
      emphasize: props.purchase.safeAfter < 0,
    },
  ]
})

const shortfallText = computed(() =>
  props.purchase ? formatRupiah(props.purchase.shortfall) : 'Rp0',
)

/** Melihat rincian dulu — sheet ini ditutup, jadi tidak ada modal bertumpuk. */
function seeDetails() {
  emit('close')
  openBreakdown()
}
</script>

<template>
  <BaseSheet :open="open" @close="emit('cancel')">
    <template #header>
      <div class="holdup__head">
        <span class="holdup__badge">
          <AppIcon name="shield" :size="16" />
          HoldUp!
        </span>
        <h2 class="holdup__title">Sebentar, ini melewati Saldo Aman.</h2>
        <p class="holdup__lead">
          Pembelian ini {{ shortfallText }} di atas Saldo Aman kamu. Kamu tetap bisa melanjutkan.
        </p>
      </div>
    </template>

    <div class="holdup__body">
      <dl class="rows">
        <div v-for="row in rows" :key="row.label" class="rows__item">
          <dt>{{ row.label }}</dt>
          <dd class="tnum" :class="{ 'rows__value--negative': row.emphasize }">{{ row.value }}</dd>
        </div>
      </dl>

      <p class="holdup__note">
        <AppIcon name="info" :size="16" />
        <span>
          Kalau kamu lanjutkan, saldo berkurang dan jatah harian bulan ini ikut menyesuaikan.
        </span>
      </p>

      <button type="button" class="holdup__details" @click="seeDetails">
        Lihat rincian Saldo Aman
      </button>
    </div>

    <template #footer>
      <button
        type="button"
        class="btn btn--primary btn--block"
        :disabled="busy"
        @click="emit('confirm')"
      >
        {{ busy ? 'Menyimpan…' : 'Saya paham, lanjutkan' }}
      </button>
      <button type="button" class="btn btn--ghost btn--block" @click="emit('cancel')">
        Batalkan
      </button>
    </template>
  </BaseSheet>
</template>

<style scoped>
.holdup__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.holdup__badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: var(--brand-tint);
  color: var(--brand-deep);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.holdup__title {
  font-size: 20px;
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1.25;
}

.holdup__lead {
  font-size: 14px;
  line-height: 1.5;
  color: var(--ink-2);
}

.holdup__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 6px;
}

.rows {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  overflow: hidden;
}

.rows__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  font-size: 13.5px;
}

.rows__item:last-child {
  border-bottom: 0;
  background: var(--surface-2);
}

.rows__item dt {
  color: var(--ink-2);
  min-width: 0;
}

.rows__item dd {
  margin: 0;
  font-weight: 700;
  text-align: right;
  letter-spacing: -0.01em;
}

.rows__value--negative {
  color: var(--brand);
}

.holdup__note {
  display: flex;
  gap: 9px;
  padding: 12px 13px;
  border-radius: var(--r-md);
  background: var(--brand-tint);
  border: 1px solid var(--brand-tint-strong);
  color: var(--brand-deep);
  font-size: 12.5px;
  line-height: 1.5;
}

.holdup__details {
  align-self: center;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  background: none;
  color: var(--ink-2);
  font-size: 13.5px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.holdup__details:hover {
  color: var(--ink);
}
</style>
