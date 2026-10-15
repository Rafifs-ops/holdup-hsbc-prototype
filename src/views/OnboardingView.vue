<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import AmountField from '@/components/AmountField.vue'
import { formatRupiah } from '@/utils/format'
import { useDemoData } from '@/composables/useDemoData'

/**
 * Langkah pertama: pilih mau mengisi saldo simulasi sendiri atau memakai data
 * demo. Keduanya menulis ke IndexedDB, jadi pilihan ini hanya muncul sekali.
 */
const router = useRouter()
const { busy, startWithDemo, startManual } = useDemoData()

const totalBalance = ref(0)
const error = ref('')
const mode = ref('')

async function submitManual() {
  const total = Math.round(Number(totalBalance.value) || 0)
  if (total <= 0) {
    error.value = 'Isi saldo awal dulu supaya Saldo Aman bisa dihitung.'
    return
  }

  error.value = ''
  mode.value = 'manual'
  const result = await startManual({ totalBalance: total })
  if (!result.ok) {
    error.value = result.error
    mode.value = ''
    return
  }
  router.replace('/')
}

async function useDemo() {
  mode.value = 'demo'
  await startWithDemo()
  router.replace('/')
}
</script>

<template>
  <main class="onboarding">
    <div class="onboarding__inner">
      <header class="intro">
        <span class="intro__mark" aria-hidden="true">H</span>
        <h1 class="intro__title">HoldUp!</h1>
        <p class="intro__lead">
          Sebelum belanja, kami hitung dulu Saldo Aman kamu: uang yang benar-benar tersedia
          setelah tagihan, tabungan, dana darurat, dan sisihan lain dikurangi.
        </p>
        <p class="intro__note">
          Prototipe ini berjalan sepenuhnya di perangkat kamu. Tidak ada rekening sungguhan yang
          terhubung.
        </p>
      </header>

      <section class="card start" aria-labelledby="manual-heading">
        <h2 id="manual-heading" class="start__title">Isi saldo simulasi</h2>
        <p class="start__body">
          Masukkan saldo yang ingin kamu pakai untuk mencoba prototipe. Angka ini bisa diubah
          kapan saja lewat tombol “Atur Saldo”.
        </p>

        <AmountField
          v-model="totalBalance"
          input-id="onboarding-total"
          label="Saldo awal"
          :error="error"
          hint="Contoh: 5.000.000"
          autofocus
          @submit="submitManual"
        />

        <button
          type="button"
          class="btn btn--primary btn--block"
          :disabled="busy"
          @click="submitManual"
        >
          {{ mode === 'manual' && busy ? 'Menyiapkan…' : 'Mulai dengan saldo ini' }}
        </button>
      </section>

      <section class="card demo" aria-labelledby="demo-heading">
        <h2 id="demo-heading" class="demo__title">
          <AppIcon name="sparkle" :size="17" />
          Pakai data demo
        </h2>
        <p class="demo__body">
          Saldo {{ formatRupiah(8500000) }} dengan kantong Tagihan, Tabungan, dan Dana Darurat
          yang sudah terisi, plus satu misi “Laptop Baru”. Cocok untuk mencoba alur HoldUp!
          dengan cepat.
        </p>
        <button type="button" class="btn btn--ghost btn--block" :disabled="busy" @click="useDemo">
          {{ mode === 'demo' && busy ? 'Menyiapkan…' : 'Gunakan data demo' }}
        </button>
      </section>

      <p class="onboarding__foot">
        Semua angka bisa dikembalikan ke kondisi awal lewat Menu → Reset data demo.
      </p>
    </div>
  </main>
</template>

<style scoped>
.onboarding {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 28px var(--gutter) 32px;
}

.onboarding__inner {
  width: 100%;
  max-width: 460px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 2px 4px;
}

.intro__mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--brand);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 20px;
  font-weight: 800;
}

.intro__title {
  font-size: 27px;
  font-weight: 750;
  letter-spacing: -0.035em;
}

.intro__lead {
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink-2);
}

.intro__note {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}

.start,
.demo {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.start__title,
.demo__title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.start__body,
.demo__body {
  font-size: 13px;
  line-height: 1.55;
  color: var(--ink-2);
}

.demo__title {
  color: var(--brand-deep);
}

.onboarding__foot {
  margin-top: 2px;
  font-size: 11.5px;
  color: var(--ink-3);
  text-align: center;
  line-height: 1.5;
}
</style>
