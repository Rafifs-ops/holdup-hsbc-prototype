<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'

const route = useRoute()

const items = [
  { label: 'Home', to: '/', icon: 'home' },
  { label: 'Aktivitas', to: '/aktivitas', icon: 'activity' },
  { label: 'HoldUp!', to: '/holdup', icon: 'shield', accent: true },
  { label: 'Menu', to: '/menu', icon: 'grid' },
]

const activePath = computed(() => route.path)

function isActive(item) {
  if (item.to === '/') return activePath.value === '/'
  return activePath.value === item.to || activePath.value.startsWith(`${item.to}/`)
}
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigasi utama">
    <ul class="bottom-nav__list">
      <li v-for="item in items" :key="item.to" class="bottom-nav__item">
        <RouterLink
          :to="item.to"
          class="bottom-nav__link"
          :class="{ 'is-active': isActive(item), 'is-accent': item.accent }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <AppIcon :name="item.icon" :size="22" />
          <span class="bottom-nav__label">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background: var(--surface);
  border-top: 1px solid var(--line);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.bottom-nav__list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: 520px;
  margin: 0 auto;
}

.bottom-nav__link {
  min-height: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--ink-3);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.01em;
  border-radius: var(--r-md);
  transition: color var(--dur-fast) var(--ease);
}

.bottom-nav__link:hover {
  color: var(--ink-2);
}

.bottom-nav__link.is-active {
  color: var(--ink);
}

.bottom-nav__link.is-accent.is-active {
  color: var(--brand);
}

.bottom-nav__label {
  line-height: 1;
}

@media (min-width: 900px) {
  .bottom-nav {
    background: transparent;
    border-top: 0;
    padding: 0 0 18px;
    bottom: 0;
  }

  .bottom-nav__list {
    max-width: 460px;
    gap: 6px;
    padding: 6px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    box-shadow: var(--shadow-sm);
  }

  .bottom-nav__link {
    min-height: 48px;
    flex-direction: row;
    gap: 8px;
    font-size: 13.5px;
    border-radius: var(--r-pill);
  }

  .bottom-nav__link.is-active {
    background: var(--surface-2);
  }

  .bottom-nav__link.is-accent.is-active {
    background: var(--brand-tint);
  }
}
</style>
