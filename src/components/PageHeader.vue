<script setup>
import { useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  backTo: { type: [String, Object], default: null },
  showBack: { type: Boolean, default: true },
})

const emit = defineEmits(['back'])
const router = useRouter()

function goBack() {
  emit('back')
  if (props.backTo) router.push(props.backTo)
  else if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="page-header">
    <div class="page-header__row">
      <button
        v-if="showBack"
        type="button"
        class="page-header__back"
        aria-label="Kembali"
        @click="goBack"
      >
        <AppIcon name="arrowLeft" :size="20" />
      </button>
      <div class="page-header__text">
        <h1 class="page-header__title">{{ title }}</h1>
        <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
      </div>
      <div class="page-header__action">
        <slot name="action" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  padding: 16px 0 6px;
}

.page-header__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header__back {
  width: 44px;
  height: 44px;
  margin-left: -8px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--surface);
  flex: none;
}

.page-header__back:hover {
  background: var(--surface-2);
}

.page-header__text {
  flex: 1;
  min-width: 0;
}

.page-header__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.page-header__subtitle {
  font-size: 13px;
  color: var(--ink-2);
  margin-top: 1px;
}

.page-header__action {
  flex: none;
}
</style>
