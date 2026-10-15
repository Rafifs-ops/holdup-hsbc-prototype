<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import { greetingFor } from '@/utils/date'
import { initialsFrom } from '@/utils/format'
import { useUiStore } from '@/stores/ui'
import { useFinanceStore } from '@/stores/finance'

/**
 * Header ringkas: sapaan, nama, dan satu ikon notifikasi. Aksi lain sengaja
 * dipindah ke dashboard atau ke halaman Menu supaya fokus tetap di Saldo Aman.
 */
const props = defineProps({
  notifications: { type: Number, default: 0 },
})

const ui = useUiStore()
const finance = useFinanceStore()
const { userName } = storeToRefs(finance)

const greeting = computed(() => greetingFor(new Date()))
const initials = computed(() => initialsFrom(userName.value))
</script>

<template>
  <header class="app-header">
    <div class="app-header__text">
      <p class="app-header__hello">
        <span class="app-header__avatar" aria-hidden="true">{{ initials }}</span>
        {{ greeting }},
      </p>
      <h1 class="app-header__name">{{ userName }}</h1>
    </div>

    <button
      type="button"
      class="app-header__bell"
      :aria-label="
        props.notifications
          ? `Notifikasi, ${props.notifications} baru`
          : 'Notifikasi, belum ada yang baru'
      "
      @click="ui.pushToast('Belum ada notifikasi baru untuk kamu.', { tone: 'neutral' })"
    >
      <AppIcon name="bell" :size="20" />
      <span v-if="props.notifications" class="app-header__dot" aria-hidden="true" />
    </button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 0 10px;
}

.app-header__text {
  min-width: 0;
}

.app-header__hello {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-2);
}

.app-header__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--brand-tint);
  color: var(--brand-deep);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.app-header__name {
  margin-top: 2px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.025em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-header__bell {
  position: relative;
  width: 44px;
  height: 44px;
  flex: none;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--surface);
  color: var(--ink);
}

.app-header__bell:hover {
  background: var(--surface-2);
}

.app-header__dot {
  position: absolute;
  top: 10px;
  right: 11px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand);
  border: 2px solid var(--surface);
}
</style>
