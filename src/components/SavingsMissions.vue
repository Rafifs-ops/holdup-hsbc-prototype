<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AppIcon from './AppIcon.vue'
import BaseSheet from './BaseSheet.vue'
import AmountField from './AmountField.vue'
import SavingsMissionCard from './SavingsMissionCard.vue'
import { useMissionsStore } from '@/stores/missions'
import { useFinanceStore } from '@/stores/finance'
import { useMoneySheets } from '@/composables/useMoneySheets'
import { useUiStore } from '@/stores/ui'
import { formatRupiah } from '@/utils/format'

/**
 * Misi tabungan dibuat dengan tiga input: nama tujuan, target nominal, dan
 * saldo awal (opsional). Uang yang masuk misi selalu berasal dari Saldo Aman
 * dan berpindah ke kantong Tabungan, sehingga tidak pernah dihitung dua kali.
 */
const missions = useMissionsStore()
const finance = useFinanceStore()
const ui = useUiStore()
const { openBalance } = useMoneySheets()

const { missions: missionList, totalSaved, totalTarget, hasMissions, unallocatedSavings } =
  storeToRefs(missions)
const { amountsHidden, savingsTarget, safeBalance } = storeToRefs(finance)

/* ------------------------------------------------------------- create --- */
const createOpen = ref(false)
const createForm = ref({ name: '', target: 0, initialAmount: 0 })
const createErrors = ref({})
const saving = ref(false)

function openCreate() {
  createForm.value = { name: '', target: 0, initialAmount: 0 }
  createErrors.value = {}
  createOpen.value = true
}

async function submitCreate() {
  const errors = {}
  const name = createForm.value.name.trim()
  if (name.length < 3) errors.name = 'Nama misi minimal 3 karakter.'
  if (createForm.value.target <= 0) errors.target = 'Target nominal harus lebih besar dari Rp0.'
  if (createForm.value.initialAmount > createForm.value.target && createForm.value.target > 0) {
    errors.initialAmount = 'Saldo awal tidak perlu melebihi target misi.'
  }
  createErrors.value = errors
  if (Object.keys(errors).length) return

  saving.value = true
  try {
    const result = await missions.createMission({ ...createForm.value, name })
    if (!result.ok) {
      createErrors.value = { [result.field || 'target']: result.error }
      return
    }
    ui.pushToast(`Misi “${result.mission.name}” dibuat.`)
    createOpen.value = false
  } finally {
    saving.value = false
  }
}

/* ---------------------------------------------------------- add funds --- */
const addOpen = ref(false)
const activeMission = ref(null)
const addAmount = ref(0)
const addError = ref('')

const quickAdds = computed(() => {
  if (!activeMission.value) return []
  const remaining = missions.remainingToSave(activeMission.value)
  const options = [100_000, 250_000, 500_000].filter((value) => value <= remaining)
  if (remaining > 0 && remaining <= 2_000_000) options.push(remaining)
  return [...new Set(options)].slice(0, 4)
})

function openAddFunds(mission) {
  activeMission.value = mission
  addAmount.value = 0
  addError.value = ''
  addOpen.value = true
}

async function submitAddFunds() {
  if (!activeMission.value) return
  saving.value = true
  try {
    const result = await missions.addFunds(activeMission.value.id, addAmount.value)
    if (!result.ok) {
      addError.value = result.error
      return
    }
    ui.pushToast(`${formatRupiah(addAmount.value)} masuk ke misi ${result.mission.name}.`)
    if (result.completed) {
      ui.pushToast('Target misi ini tercapai. Kerja bagus!', { tone: 'neutral', duration: 3600 })
    }
    addOpen.value = false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="missions">
    <section v-if="hasMissions" class="summary card" aria-label="Ringkasan misi">
      <div class="summary__stat">
        <p class="summary__label">Terkumpul</p>
        <p class="summary__value tnum">
          {{ amountsHidden ? 'Rp••••' : formatRupiah(totalSaved) }}
        </p>
      </div>
      <div class="summary__stat summary__stat--right">
        <p class="summary__label">Total target misi</p>
        <p class="summary__value summary__value--muted tnum">
          {{ amountsHidden ? 'Rp••••' : formatRupiah(totalTarget) }}
        </p>
      </div>
      <p class="summary__note">
        Target misi tidak mengurangi saldo sekaligus. Yang mengurangi Saldo Aman adalah dana yang
        benar-benar kamu pindahkan ke kantong Tabungan, ditambah Target Tabungan
        ({{ amountsHidden ? 'Rp••••' : formatRupiah(savingsTarget) }}).
      </p>
    </section>

    <ul v-if="hasMissions" class="list">
      <li v-for="mission in missionList" :key="mission.id">
        <SavingsMissionCard :mission="mission" :hidden="amountsHidden" @add-funds="openAddFunds" />
      </li>
    </ul>

    <section v-else class="empty card" aria-label="Belum ada misi">
      <span class="empty__icon" aria-hidden="true">
        <AppIcon name="flag" :size="26" />
      </span>
      <h2 class="empty__title">Belum ada misi tabungan</h2>
      <p class="empty__body">
        Buat tujuan pertamamu — misalnya laptop baru atau liburan. Kami bantu menjaga progresnya
        tanpa mengunci uangmu.
      </p>
      <button type="button" class="btn btn--primary empty__cta" @click="openCreate">
        <AppIcon name="plus" :size="17" />
        Buat misi pertama
      </button>
    </section>

    <div v-if="hasMissions" class="actions">
      <button type="button" class="btn btn--primary btn--block" @click="openCreate">
        <AppIcon name="plus" :size="17" />
        Buat misi
      </button>
      <button type="button" class="btn btn--ghost btn--block" @click="openBalance">
        Atur saldo &amp; Target Tabungan
      </button>
    </div>

    <p class="foot">
      Dana misi {{ formatRupiah(unallocatedSavings) }} dari kantong Tabungan belum ditugaskan ke
      misi mana pun.
    </p>

    <!-- ---------------------------------------------------- sheet: buat misi -->
    <BaseSheet
      :open="createOpen"
      title="Buat misi tabungan"
      subtitle="Tiga isian saja: tujuan, target, dan saldo awal bila ada."
      size="tall"
      @close="createOpen = false"
    >
      <form class="form" novalidate @submit.prevent="submitCreate">
        <div class="field">
          <label class="field-label" for="mission-name">Nama tujuan</label>
          <input
            id="mission-name"
            v-model="createForm.name"
            class="control"
            type="text"
            placeholder="Contoh: Liburan ke Bali"
            autocomplete="off"
            data-autofocus
            :aria-invalid="createErrors.name ? 'true' : 'false'"
          >
          <p v-if="createErrors.name" class="field-error" role="alert">
            <span aria-hidden="true">•</span>{{ createErrors.name }}
          </p>
        </div>

        <AmountField
          v-model="createForm.target"
          input-id="mission-target"
          label="Target nominal"
          :error="createErrors.target"
          hint="Target jangka panjang. Tidak mengurangi Saldo Aman."
          placeholder="0"
        />

        <AmountField
          v-model="createForm.initialAmount"
          input-id="mission-initial"
          label="Saldo awal terkumpul (opsional)"
          :error="createErrors.initialAmount"
          hint="Diambil dari Saldo Aman dan dipindahkan ke kantong Tabungan."
          placeholder="0"
        />

        <p class="form__note">
          Saldo Aman kamu saat ini
          {{ amountsHidden ? 'Rp••••' : formatRupiah(Math.max(0, safeBalance)) }}.
        </p>
      </form>

      <template #footer>
        <button
          type="button"
          class="btn btn--primary btn--block"
          :disabled="saving"
          @click="submitCreate"
        >
          {{ saving ? 'Menyimpan…' : 'Buat misi' }}
        </button>
        <button type="button" class="btn btn--ghost btn--block" @click="createOpen = false">
          Batal
        </button>
      </template>
    </BaseSheet>

    <!-- -------------------------------------------- sheet: tambah tabungan -->
    <BaseSheet
      :open="addOpen"
      :title="activeMission ? `Tambah tabungan — ${activeMission.name}` : 'Tambah tabungan'"
      subtitle="Dana diambil dari Saldo Aman dan masuk ke kantong Tabungan."
      @close="addOpen = false"
    >
      <form class="form" novalidate @submit.prevent="submitAddFunds">
        <div v-if="activeMission" class="target-box">
          <div class="target-box__row">
            <span>Terkumpul</span>
            <strong class="tnum">{{ formatRupiah(activeMission.saved) }}</strong>
          </div>
          <div class="target-box__row">
            <span>Sisa menuju target</span>
            <strong class="tnum">{{ formatRupiah(missions.remainingToSave(activeMission)) }}</strong>
          </div>
          <div class="target-box__row">
            <span>Saldo Aman tersedia</span>
            <strong class="tnum">{{ formatRupiah(Math.max(0, safeBalance)) }}</strong>
          </div>
        </div>

        <AmountField
          v-model="addAmount"
          input-id="mission-add-amount"
          label="Nominal tabungan"
          :error="addError"
          autofocus
          placeholder="0"
        />

        <div v-if="quickAdds.length" class="chips">
          <button
            v-for="value in quickAdds"
            :key="value"
            type="button"
            class="chip"
            :class="{ 'chip--active': addAmount === value }"
            @click="addAmount = value; addError = ''"
          >
            {{ formatRupiah(value) }}
          </button>
        </div>

        <div v-if="safeBalance <= 0" class="notice notice--info" role="status">
          <AppIcon name="alert" :size="17" />
          <span>
            Saldo Aman kamu sedang Rp0 atau minus, jadi belum ada dana bebas untuk ditabung.
            Tambah saldo dulu lewat “Atur Saldo”.
          </span>
        </div>
      </form>

      <template #footer>
        <button
          type="button"
          class="btn btn--primary btn--block"
          :disabled="saving"
          @click="submitAddFunds"
        >
          {{ saving ? 'Menyimpan…' : 'Simpan tabungan' }}
        </button>
        <button type="button" class="btn btn--ghost btn--block" @click="addOpen = false">
          Batal
        </button>
      </template>
    </BaseSheet>
  </div>
</template>

<style scoped>
.missions {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 10px;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px 18px;
  padding: 15px 16px;
}

.summary__stat {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.summary__stat--right {
  text-align: right;
}

.summary__label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-3);
}

.summary__value {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.025em;
}

.summary__value--muted {
  color: var(--ink-2);
}

.summary__note {
  flex-basis: 100%;
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 28px 20px;
}

.empty__icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: var(--brand-tint);
  color: var(--brand);
  margin-bottom: 4px;
}

.empty__title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.empty__body {
  font-size: 13.5px;
  color: var(--ink-2);
  line-height: 1.55;
  max-width: 34ch;
}

.empty__cta {
  margin-top: 8px;
  width: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 6px;
}

.form__note {
  font-size: 12px;
  color: var(--ink-3);
  line-height: 1.5;
}

.target-box {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px 14px;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.target-box__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13.5px;
  color: var(--ink-2);
}

.target-box__row strong {
  color: var(--ink);
  font-weight: 700;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.chip {
  min-height: 38px;
  padding: 0 12px;
  border-radius: var(--r-pill);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink-2);
  font-size: 12.5px;
  font-weight: 600;
}

.chip:hover {
  background: var(--surface-2);
  color: var(--ink);
}

.chip--active {
  background: var(--brand-tint);
  border-color: var(--brand);
  color: var(--brand-deep);
}

.foot {
  font-size: 11.5px;
  color: var(--ink-3);
  line-height: 1.5;
}
</style>
