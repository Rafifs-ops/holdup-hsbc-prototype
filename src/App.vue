<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import BottomNavigation from '@/components/BottomNavigation.vue'
import ToastStack from '@/components/ToastStack.vue'
import AppIcon from '@/components/AppIcon.vue'
import BalanceSettingsSheet from '@/components/BalanceSettingsSheet.vue'
import PocketBreakdownSheet from '@/components/PocketBreakdownSheet.vue'
import { useFinanceStore } from '@/stores/finance'
import { useMissionsStore } from '@/stores/missions'

/**
 * Sheet pengaturan saldo dimount tepat sekali di sini; halaman mana pun
 * membukanya lewat composable bersama. Alur Bayar berdiri sendiri di PayView.
 */
const finance = useFinanceStore()
const missions = useMissionsStore()
const route = useRoute()

const { ready, error } = storeToRefs(finance)
const { error: missionsError } = storeToRefs(missions)

const bootError = computed(() => error.value || missionsError.value)
const isBare = computed(() => Boolean(route.meta?.bare))

async function retryBoot() {
  await Promise.all([finance.init(), missions.init()])
}
</script>

<template>
  <div class="app-shell">
    <div v-if="!ready && !bootError" class="boot" role="status" aria-live="polite">
      <span class="boot__mark" aria-hidden="true">H</span>
      <p class="boot__text">Menyiapkan data kamu…</p>
    </div>

    <div v-else-if="!ready && bootError" class="boot boot--error" role="alert">
      <span class="boot__mark boot__mark--error" aria-hidden="true">
        <AppIcon name="alert" :size="22" />
      </span>
      <h1 class="boot__title">Penyimpanan lokal tidak bisa dibuka</h1>
      <p class="boot__text">{{ bootError }}</p>
      <button type="button" class="btn btn--primary" @click="retryBoot">Coba lagi</button>
    </div>

    <template v-else>
      <RouterView />
      <BottomNavigation v-if="!isBare" />
    </template>

    <ToastStack />

    <BalanceSettingsSheet />
    <PocketBreakdownSheet />
  </div>
</template>

<style scoped>
.boot {
  flex: 1;
  min-height: 70dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

.boot__mark {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: var(--brand);
  color: #fff;
  font-size: 20px;
  font-weight: 800;
}

.boot__mark--error {
  background: var(--brand-tint);
  color: var(--brand);
}

.boot__title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.boot__text {
  max-width: 34ch;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}
</style>
