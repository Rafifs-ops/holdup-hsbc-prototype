<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import ProgressBar from './ProgressBar.vue'
import { formatPercent, formatRupiah } from '@/utils/format'
import { useMissionsStore } from '@/stores/missions'

const props = defineProps({
  mission: { type: Object, required: true },
  showAddButton: { type: Boolean, default: true },
  hidden: { type: Boolean, default: false },
})

const emit = defineEmits(['add-funds'])

const missions = useMissionsStore()

const ratio = computed(() => missions.progressRatio(props.mission))
const percentText = computed(() => formatPercent(ratio.value))
const savedText = computed(() => (props.hidden ? 'Rp••••' : formatRupiah(props.mission.saved)))
const targetText = computed(() => (props.hidden ? 'Rp••••' : formatRupiah(props.mission.target)))
const remainingText = computed(() =>
  props.hidden ? 'Rp••••' : formatRupiah(missions.remainingToSave(props.mission)),
)
const isComplete = computed(() => props.mission.saved >= props.mission.target)
</script>

<template>
  <article class="mission card">
    <header class="mission__head">
      <div class="mission__title-wrap">
        <span class="mission__badge" aria-hidden="true">
          <AppIcon name="flag" :size="16" />
        </span>
        <div>
          <h3 class="mission__name">{{ mission.name }}</h3>
          <p class="mission__note">
            {{ isComplete ? 'Target tercapai. Selamat!' : `${remainingText} lagi menuju target` }}
          </p>
        </div>
      </div>
      <span class="mission__percent tnum" :class="{ 'mission__percent--done': isComplete }">
        {{ percentText }}
      </span>
    </header>

    <ProgressBar :value="ratio" :label="`Progres misi ${mission.name}`" :tone="isComplete ? 'success' : 'brand'" />

    <dl class="mission__figures">
      <div class="mission__figure">
        <dt>Terkumpul</dt>
        <dd class="tnum">{{ savedText }}</dd>
      </div>
      <div class="mission__figure mission__figure--right">
        <dt>Target</dt>
        <dd class="tnum">{{ targetText }}</dd>
      </div>
    </dl>

    <button
      v-if="showAddButton"
      type="button"
      class="btn btn--ghost mission__cta"
      @click="emit('add-funds', mission)"
    >
      <AppIcon name="plus" :size="17" />
      Tambah tabungan
    </button>
  </article>
</template>

<style scoped>
.mission {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mission__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.mission__title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.mission__badge {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: var(--brand-tint);
  color: var(--brand);
  flex: none;
}

.mission__name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.mission__note {
  font-size: 12.5px;
  color: var(--ink-3);
}

.mission__percent {
  font-size: 14px;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-tint);
  border-radius: var(--r-pill);
  padding: 3px 9px;
  flex: none;
}

.mission__percent--done {
  background: var(--positive-tint);
  color: var(--positive);
}

.mission__figures {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
}

.mission__figure {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mission__figure--right {
  text-align: right;
}

.mission__figure dt {
  font-size: 11.5px;
  color: var(--ink-3);
  font-weight: 600;
}

.mission__figure dd {
  margin: 0;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.mission__cta {
  min-height: 44px;
  font-size: 14px;
}
</style>
