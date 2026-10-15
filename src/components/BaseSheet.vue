<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

/**
 * Bottom sheet on mobile, centred dialog on desktop.
 * Locks background scroll, closes on Esc/backdrop, and keeps focus inside.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  dismissible: { type: Boolean, default: true },
  size: { type: String, default: 'auto' }, // auto | tall
})

const emit = defineEmits(['close'])

const panel = ref(null)
const titleId = `sheet-title-${Math.random().toString(36).slice(2, 8)}`
let previousOverflow = ''
let lastFocused = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function setScrollLock(locked) {
  if (typeof document === 'undefined') return
  if (locked) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousOverflow || ''
  }
}

/**
 * Keep the focused field visible so the on-screen keyboard never covers the
 * input the user is typing an amount into.
 */
function onFocusIn(event) {
  const el = event.target
  if (!(el instanceof HTMLElement)) return
  if (!el.matches('input, select, textarea')) return
  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  requestAnimationFrame(() => {
    el.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' })
  })
}

function onKeydown(event) {
  if (event.key === 'Escape' && props.dismissible) {
    emit('close')
    return
  }
  if (event.key !== 'Tab' || !panel.value) return

  const nodes = Array.from(panel.value.querySelectorAll(FOCUSABLE)).filter(
    (node) => node.offsetParent !== null,
  )
  if (!nodes.length) return

  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    setScrollLock(isOpen)
    if (isOpen) {
      lastFocused = document.activeElement
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      const target = panel.value?.querySelector('[data-autofocus]') || panel.value
      target?.focus?.({ preventScroll: true })
    } else {
      window.removeEventListener('keydown', onKeydown)
      if (lastFocused?.focus) lastFocused.focus({ preventScroll: true })
      lastFocused = null
    }
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  setScrollLock(false)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="sheet-root">
        <div
          class="sheet-backdrop"
          @click="dismissible && emit('close')"
        />
        <div
          ref="panel"
          class="sheet-panel"
          :class="`sheet-panel--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          tabindex="-1"
          @focusin="onFocusIn"
        >
          <div class="sheet-grip" aria-hidden="true" />

          <header v-if="title || $slots.header" class="sheet-head">
            <slot name="header">
              <div class="sheet-head__text">
                <h2 :id="titleId" class="sheet-title">{{ title }}</h2>
                <p v-if="subtitle" class="sheet-subtitle">{{ subtitle }}</p>
              </div>
              <button
                v-if="dismissible"
                type="button"
                class="sheet-close"
                aria-label="Tutup"
                @click="emit('close')"
              >
                <AppIcon name="close" :size="18" />
              </button>
            </slot>
          </header>

          <div class="sheet-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="sheet-foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-root {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(11, 11, 12, 0.44);
  backdrop-filter: blur(1.5px);
}

.sheet-panel {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border-radius: 22px 22px 0 0;
  box-shadow: var(--shadow-md);
  padding: 8px 0 calc(16px + env(safe-area-inset-bottom, 0px));
  overscroll-behavior: contain;
}

.sheet-panel--tall {
  height: 92dvh;
}

.sheet-panel:focus {
  outline: none;
}

.sheet-grip {
  width: 42px;
  height: 4px;
  border-radius: var(--r-pill);
  background: var(--line-strong);
  margin: 6px auto 10px;
  flex: none;
}

.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px 12px;
  flex: none;
}

.sheet-head__text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sheet-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sheet-subtitle {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.45;
}

.sheet-close {
  width: 36px;
  height: 36px;
  margin: -4px -6px 0 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: var(--r-pill);
  background: var(--surface-2);
  color: var(--ink-2);
  flex: none;
}

.sheet-close:hover {
  background: #eceef1;
  color: var(--ink);
}

.sheet-body {
  padding: 0 20px;
  overflow-y: auto;
  flex: 1 1 auto;
  overscroll-behavior: contain;
}

/* Breathing room so the virtual keyboard does not sit on the active field */
.sheet-body :deep(input),
.sheet-body :deep(select),
.sheet-body :deep(textarea) {
  scroll-margin-block: 88px;
}

.sheet-foot {
  padding: 14px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: none;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity var(--dur) var(--ease);
}

.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform var(--dur) var(--ease);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(24px);
}

@media (min-width: 900px) {
  .sheet-root {
    align-items: center;
    padding: 24px;
  }

  .sheet-panel {
    border-radius: 22px;
    max-width: 480px;
    max-height: min(760px, 88dvh);
    padding-bottom: 20px;
  }

  .sheet-panel--tall {
    height: min(760px, 88dvh);
  }

  .sheet-grip {
    display: none;
  }

  .sheet-head {
    padding-top: 20px;
  }

  .sheet-enter-from .sheet-panel,
  .sheet-leave-to .sheet-panel {
    transform: translateY(10px) scale(0.985);
  }
}
</style>
