<script setup>
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const { toasts } = storeToRefs(ui)

const ICONS = {
  success: 'check',
  warn: 'alert',
  neutral: 'info',
}
</script>

<template>
  <div class="toast-stack" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.tone}`"
        @click="ui.dismissToast(toast.id)"
      >
        <AppIcon :name="ICONS[toast.tone] || 'info'" :size="17" />
        <span>{{ toast.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 14px);
  z-index: 80;
  width: min(440px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--r-md);
  background: #16171a;
  color: #fff;
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  box-shadow: var(--shadow-md);
  cursor: pointer;
}

.toast--warn {
  background: var(--brand-deep);
}

.toast--neutral {
  background: #33353a;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity var(--dur) var(--ease), transform var(--dur) var(--ease);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (min-width: 900px) {
  .toast-stack {
    bottom: 106px;
  }
}
</style>
