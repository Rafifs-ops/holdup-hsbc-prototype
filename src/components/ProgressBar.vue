<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 0..1 */
  value: { type: Number, default: 0 },
  label: { type: String, default: 'Progres misi' },
  tone: { type: String, default: 'brand' }, // brand | neutral | success
})

const percent = computed(() => Math.round(Math.min(Math.max(props.value, 0), 1) * 100))
</script>

<template>
  <div
    class="progress"
    :class="`progress--${tone}`"
    role="progressbar"
    :aria-valuenow="percent"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-label="label"
  >
    <div class="progress__fill" :style="{ width: `${percent}%` }" />
  </div>
</template>

<style scoped>
.progress {
  height: 8px;
  width: 100%;
  border-radius: var(--r-pill);
  background: #eceef1;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  border-radius: inherit;
  background: var(--brand);
  transition: width var(--dur) var(--ease);
}

.progress--neutral .progress__fill {
  background: var(--ink);
}

.progress--success .progress__fill {
  background: var(--positive);
}
</style>
