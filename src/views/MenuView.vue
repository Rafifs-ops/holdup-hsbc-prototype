<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import PageHeader from '@/components/PageHeader.vue'
import BaseSheet from '@/components/BaseSheet.vue'
import { initialsFrom } from '@/utils/format'
import { useDemoData } from '@/composables/useDemoData'
import { useMoneySheets } from '@/composables/useMoneySheets'
import { useFinanceStore } from '@/stores/finance'
import { useUiStore } from '@/stores/ui'

const finance = useFinanceStore()
const ui = useUiStore()
const { resetDemo, busy } = useDemoData()
const { openBalance } = useMoneySheets()

const initials = initialsFrom(finance.userName)
const resetOpen = ref(false)

const groups = [
  {
    title: 'Layanan',
    items: [
      { label: 'Transfer', description: 'Kirim uang ke rekening lain', icon: 'send', to: '/transfer' },
      { label: 'Bayar', description: 'Tagihan dan merchant', icon: 'card', to: '/bayar' },
      { label: 'Top Up', description: 'Tambah saldo simulasi', icon: 'plus', to: '/topup' },
      { label: 'Semua Layanan', description: 'Fitur perbankan lainnya', icon: 'grid', to: '/layanan' },
    ],
  },
  {
    title: 'Perencanaan',
    items: [
      {
        label: 'Atur Saldo',
        description: 'Saldo, kantong, dan Target Tabungan',
        icon: 'wallet',
        action: 'balance',
      },
      { label: 'Kantong & Saldo', description: 'Lihat perhitungan Saldo Aman', icon: 'receipt', to: '/kantong' },
      { label: 'Misi Tabungan', description: 'Tujuan dan progresnya', icon: 'flag', to: '/misi' },
      { label: 'HoldUp!', description: 'Cara kerja Saldo Aman', icon: 'shield', to: '/holdup' },
    ],
  },
  {
    title: 'Bantuan & pengaturan',
    items: [
      { label: 'Notifikasi', description: 'Preferensi pemberitahuan', icon: 'bell' },
      { label: 'Keamanan', description: 'PIN, biometrik, dan perangkat', icon: 'lock' },
      { label: 'Bantuan', description: 'Hubungi layanan nasabah', icon: 'info' },
    ],
  },
]

function handleItem(item) {
  if (item.action === 'balance') {
    openBalance()
    return
  }
  if (item.to) return
  ui.pushToast(`${item.label} belum tersedia di prototipe ini.`, { tone: 'neutral' })
}

async function confirmReset() {
  await resetDemo()
  resetOpen.value = false
}
</script>

<template>
  <main class="page">
    <PageHeader title="Menu" subtitle="Pengaturan dan layanan kamu" />

    <section class="profile card" aria-label="Profil pengguna">
      <span class="profile__avatar" aria-hidden="true">{{ initials }}</span>
      <div class="profile__text">
        <p class="profile__name">{{ finance.userName }}</p>
        <p class="profile__meta">{{ finance.accountLabel }}</p>
      </div>
    </section>

    <div class="groups">
      <section v-for="group in groups" :key="group.title" class="group">
        <h2 class="section-title group__title">{{ group.title }}</h2>
        <ul class="list card card--flush">
          <li v-for="item in group.items" :key="item.label">
            <component
              :is="item.to ? 'RouterLink' : 'button'"
              :to="item.to"
              type="button"
              class="item"
              @click="handleItem(item)"
            >
              <span class="item__icon" aria-hidden="true">
                <AppIcon :name="item.icon" :size="18" />
              </span>
              <span class="item__text">
                <span class="item__label">{{ item.label }}</span>
                <span class="item__desc">{{ item.description }}</span>
              </span>
              <AppIcon name="chevronRight" :size="17" />
            </component>
          </li>
        </ul>
      </section>
    </div>

    <section class="demo card" aria-labelledby="demo-heading">
      <h2 id="demo-heading" class="section-title">Data di perangkat ini</h2>
      <p class="demo__body">
        Saldo, kantong, misi, dan riwayat transaksi disimpan di IndexedDB perangkat kamu, jadi
        semuanya tetap ada setelah aplikasi ditutup. Tidak ada data yang dikirim ke server.
      </p>
      <button type="button" class="btn btn--ghost btn--block" @click="resetOpen = true">
        <AppIcon name="refresh" :size="17" />
        Reset data demo
      </button>
      <p class="demo__note">
        Reset mengembalikan kondisi awal: saldo {{ 'Rp8.500.000' }}, alokasi kantong contoh, satu
        misi “Laptop Baru”, dan riwayat transaksi demo.
      </p>
    </section>

    <p class="version">HoldUp! prototype • v0.2 • Data simulasi lokal</p>

    <BaseSheet
      :open="resetOpen"
      title="Reset data demo?"
      subtitle="Semua saldo, kantong, misi, dan riwayat yang kamu buat akan diganti data contoh."
      @close="resetOpen = false"
    >
      <div class="confirm">
        <p class="confirm__item">
          <AppIcon name="alert" :size="17" />
          <span>Perubahan yang sudah kamu simpan akan hilang dan tidak bisa dikembalikan.</span>
        </p>
        <p class="confirm__item">
          <AppIcon name="refresh" :size="17" />
          <span>Reset hanya menyentuh penyimpanan lokal prototipe ini, bukan data lain.</span>
        </p>
      </div>

      <template #footer>
        <button
          type="button"
          class="btn btn--primary btn--block"
          :disabled="busy"
          @click="confirmReset"
        >
          {{ busy ? 'Mereset…' : 'Ya, reset sekarang' }}
        </button>
        <button type="button" class="btn btn--ghost btn--block" @click="resetOpen = false">
          Batal
        </button>
      </template>
    </BaseSheet>
  </main>
</template>

<style scoped>
.profile {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 14px 0;
  padding: 15px 16px;
}

.profile__avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--brand);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 750;
  flex: none;
}

.profile__text {
  flex: 1;
  min-width: 0;
}

.profile__name {
  font-size: 15.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.profile__meta {
  font-size: 12.5px;
  color: var(--ink-3);
}

.groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.group__title {
  margin-bottom: 9px;
}

.item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  text-align: left;
  color: var(--ink-3);
}

.list li:last-child .item {
  border-bottom: 0;
}

.item:hover {
  background: var(--surface-2);
}

.item__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--ink);
  flex: none;
}

.item__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item__label {
  font-size: 14.5px;
  font-weight: 650;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.item__desc {
  font-size: 12.5px;
  color: var(--ink-3);
}

.demo {
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.demo__body {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-2);
}

.demo__note {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 6px;
}

.confirm__item {
  display: flex;
  gap: 9px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-2);
}

.version {
  margin: 22px 0 6px;
  text-align: center;
  font-size: 11.5px;
  color: var(--ink-3);
}
</style>
