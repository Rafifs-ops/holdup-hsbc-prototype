import { ref } from 'vue'
import { defineStore } from 'pinia'

/** Lightweight toast queue used for post-action feedback. */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])
  let seq = 0

  function pushToast(message, { tone = 'success', duration = 2800 } = {}) {
    const id = ++seq
    toasts.value = [...toasts.value, { id, message, tone }]
    if (typeof window !== 'undefined') {
      window.setTimeout(() => dismissToast(id), duration)
    }
    return id
  }

  function dismissToast(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return { toasts, pushToast, dismissToast }
})
