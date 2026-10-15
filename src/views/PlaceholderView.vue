<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import AppIcon from '@/components/AppIcon.vue'

/** Landing page for menus outside the prototype focus, kept visually consistent. */
const route = useRoute()
const router = useRouter()

const meta = computed(() => ({
  title: route.meta?.title || 'Segera hadir',
  subtitle: route.meta?.subtitle || '',
  icon: route.meta?.icon || 'info',
  body: route.meta?.body || 'Fitur ini belum termasuk dalam prototipe HoldUp!.',
}))

const skeletonRows = [1, 2, 3]
</script>

<template>
  <main class="page">
    <PageHeader :title="meta.title" :subtitle="meta.subtitle" />

    <section class="placeholder card">
      <span class="placeholder__icon" aria-hidden="true">
        <AppIcon :name="meta.icon" :size="28" />
      </span>
      <h2 class="placeholder__title">Halaman ini masih placeholder</h2>
      <p class="placeholder__body">{{ meta.body }}</p>

      <ul class="placeholder__skeleton" aria-hidden="true">
        <li v-for="row in skeletonRows" :key="row" class="placeholder__row">
          <span class="placeholder__avatar" />
          <span class="placeholder__lines">
            <span class="placeholder__line" />
            <span class="placeholder__line placeholder__line--short" />
          </span>
        </li>
      </ul>
    </section>

    <div class="placeholder__actions">
      <button type="button" class="btn btn--ghost btn--block" @click="router.push('/')">
        Kembali ke dashboard
      </button>
    </div>

    <p class="placeholder__note">
      Struktur header, tipografi, dan navigasi di halaman ini sama seperti dashboard agar
      prototype terasa satu aplikasi.
    </p>
  </main>
</template>

<style scoped>
.placeholder {
  margin: 14px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 26px 20px;
}

.placeholder__icon {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: var(--brand-tint);
  color: var(--brand);
  margin-bottom: 4px;
}

.placeholder__title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.placeholder__body {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.55;
  max-width: 38ch;
}

.placeholder__skeleton {
  width: 100%;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.placeholder__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface-2);
}

.placeholder__avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #e9eaee;
  flex: none;
}

.placeholder__lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.placeholder__line {
  height: 9px;
  border-radius: var(--r-pill);
  background: #e9eaee;
}

.placeholder__line--short {
  width: 55%;
}

.placeholder__actions {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.placeholder__note {
  margin: 16px 0 4px;
  font-size: 12px;
  color: var(--ink-3);
  text-align: center;
  line-height: 1.5;
}
</style>
