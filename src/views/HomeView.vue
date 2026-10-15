<script setup>
import AppHeader from '@/components/AppHeader.vue'
import AccountBalanceCard from '@/components/AccountBalanceCard.vue'
import SafeBalanceCard from '@/components/SafeBalanceCard.vue'
import QuickActions from '@/components/QuickActions.vue'
import SavingsMissionPreview from '@/components/SavingsMissionPreview.vue'
import RecentTransactions from '@/components/RecentTransactions.vue'

/**
 * Satu halaman, satu fokus utama: Saldo Aman. Sisanya hanya pendukung —
 * ringkasan saldo, empat pintasan, ringkasan tabungan, dan tiga aktivitas.
 */
</script>

<template>
  <main class="page home">
    <AppHeader />

    <AccountBalanceCard />

    <SafeBalanceCard />

    <QuickActions />

    <SavingsMissionPreview />

    <RecentTransactions :limit="3" />

    <p class="home__footnote">
      Data prototipe tersimpan di perangkat ini (IndexedDB). Tidak ada rekening sungguhan
      yang terhubung.
    </p>
  </main>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home__footnote {
  margin: 4px 0 4px;
  font-size: 11.5px;
  color: var(--ink-3);
  text-align: center;
  line-height: 1.5;
}
</style>
