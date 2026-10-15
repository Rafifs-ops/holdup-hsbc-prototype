import { db, META_KEY, POCKET_KEYS, SETTINGS_KEY } from '@/db'
import {
  DEMO_USER,
  SCHEMA_VERSION,
  buildDemoMissions,
  buildDemoPockets,
  buildDemoSettings,
  buildDemoTransactions,
} from '@/db/seed'

/**
 * Setiap perubahan uang melewati modul ini. Operasi yang menyentuh lebih dari
 * satu tabel dijalankan dalam satu transaksi Dexie supaya saldo, kantong, dan
 * riwayat transaksi tidak pernah terpisah (inconsistent) kalau terjadi error.
 */

const LEGACY_PREFIX = 'holdup.'
const LEGACY_FINANCE_KEY = `${LEGACY_PREFIX}finance.v1`
const LEGACY_MISSIONS_KEY = `${LEGACY_PREFIX}missions.v1`

let idSeq = 0

export function newId(prefix = 'tx') {
  idSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${idSeq}-${Math.random().toString(36).slice(2, 6)}`
}

function toAmount(value) {
  const number = Math.round(Number(value))
  return Number.isFinite(number) ? number : 0
}

function computeSafeBalance(settings, pocketMap) {
  return (
    toAmount(settings.totalBalance) -
    toAmount(pocketMap.bill) -
    toAmount(pocketMap.savings) -
    toAmount(pocketMap.emergency) -
    toAmount(settings.savingsTarget)
  )
}

function pocketMapFromRows(rows = []) {
  const map = { bill: 0, savings: 0, emergency: 0 }
  rows.forEach((row) => {
    if (POCKET_KEYS.includes(row.key)) map[row.key] = toAmount(row.amount)
  })
  return map
}

/* ------------------------------------------------------------ migration --- */

function readLegacy(key) {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function clearLegacyKeys() {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.removeItem(LEGACY_FINANCE_KEY)
    window.localStorage.removeItem(LEGACY_MISSIONS_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Migrasi satu kali dari localStorage versi sebelumnya. Aman dipanggil
 * berkali-kali: flag `legacyMigrated` di tabel settings mencegah impor ganda.
 */
export async function migrateLegacyData() {
  const meta = await db.settings.get(META_KEY)
  if (meta?.legacyMigrated) return { migrated: false, skipped: true }

  const legacyFinance = readLegacy(LEGACY_FINANCE_KEY)
  const legacyMissions = readLegacy(LEGACY_MISSIONS_KEY)
  const hasLegacy = Boolean(legacyFinance || legacyMissions)

  if (hasLegacy) {
    const settings = {
      key: SETTINGS_KEY,
      ...DEMO_USER,
      totalBalance: toAmount(legacyFinance?.totalBalance),
      // Nominal sisihan khusus belum ada di versi lama, jadi dimulai dari nol
      // supaya tidak ada angka yang tiba-tiba berubah.
      savingsTarget: 0,
      onboarded: true,
      onboardedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    }

    const pockets = pocketMapFromRows([
      { key: 'bill', amount: legacyFinance?.billPocket },
      { key: 'savings', amount: legacyFinance?.savingsPocket },
      { key: 'emergency', amount: legacyFinance?.emergencyPocket },
    ])

    const missions = Array.isArray(legacyMissions?.missions) ? legacyMissions.missions : []
    const legacyTransactions = Array.isArray(legacyFinance?.transactions)
      ? legacyFinance.transactions
      : []

    await db.transaction('rw', db.settings, db.pockets, db.missions, db.transactions, async () => {
      await db.settings.put(settings)
      for (const key of POCKET_KEYS) {
        await db.pockets.put({ key, amount: pockets[key] })
      }
      for (const mission of missions) {
        await db.missions.put({
          id: String(mission.id || newId('mission')),
          name: String(mission.name || 'Misi tabungan'),
          target: toAmount(mission.target),
          saved: toAmount(mission.saved),
          note: String(mission.note || ''),
          status: toAmount(mission.saved) >= toAmount(mission.target) ? 'done' : 'active',
          createdAt: mission.createdAt || new Date().toISOString(),
        })
      }
      for (const item of legacyTransactions) {
        await db.transactions.put({
          id: String(item.id || newId('legacy')),
          name: String(item.name || 'Transaksi'),
          amount: Math.abs(toAmount(item.amount)),
          direction: item.direction === 'in' ? 'in' : 'out',
          type: item.direction === 'in' ? 'income' : 'expense',
          category: String(item.category || 'lainnya'),
          note: String(item.note || ''),
          date: item.date || new Date().toISOString(),
        })
      }
    })
  }

  await db.settings.put({
    key: META_KEY,
    legacyMigrated: true,
    migratedAt: new Date().toISOString(),
    legacyFound: hasLegacy,
  })
  if (hasLegacy) clearLegacyKeys()

  return { migrated: hasLegacy, skipped: false }
}

/* ------------------------------------------------------------- bootstrap -- */

/** Menyiapkan database: cek migrasi, lalu laporkan status onboarding. */
export async function initDatabase() {
  const migration = await migrateLegacyData()
  const settings = await db.settings.get(SETTINGS_KEY)
  return {
    migration,
    onboarded: Boolean(settings?.onboarded),
  }
}

export async function loadMissions() {
  return db.missions.toArray()
}

export async function loadSnapshot() {
  const [settings, pocketRows, missions, transactions] = await Promise.all([
    db.settings.get(SETTINGS_KEY),
    db.pockets.toArray(),
    db.missions.toArray(),
    db.transactions.orderBy('date').reverse().toArray(),
  ])

  return {
    settings: settings || null,
    pockets: pocketMapFromRows(pocketRows),
    missions,
    transactions,
  }
}

/* ------------------------------------------------------------ onboarding -- */

export async function seedDemoData() {
  await db.transaction('rw', db.settings, db.pockets, db.missions, db.transactions, async () => {
    await db.transactions.clear()
    await db.missions.clear()
    await db.pockets.clear()
    await db.settings.clear()

    await db.settings.put(buildDemoSettings())
    for (const pocket of buildDemoPockets()) await db.pockets.put(pocket)
    for (const mission of buildDemoMissions()) await db.missions.put(mission)
    for (const transaction of buildDemoTransactions()) await db.transactions.put(transaction)
    await db.settings.put({ key: META_KEY, legacyMigrated: true, migratedAt: new Date().toISOString() })
  })
}

/**
 * Onboarding manual: pengguna mengisi saldo simulasi (dan alokasi opsional).
 * Ditulis satu kali sebagai baris awal, bukan ditimpa setiap kali aplikasi dibuka.
 */
export async function seedManualData(draft = {}) {
  const totalBalance = toAmount(draft.totalBalance)
  if (totalBalance <= 0) {
    return { ok: false, error: 'Saldo awal harus lebih besar dari Rp0.' }
  }

  const pockets = {
    bill: toAmount(draft.bill),
    savings: toAmount(draft.savings),
    emergency: toAmount(draft.emergency),
  }
  const savingsTarget = toAmount(draft.savingsTarget)
  const settings = {
    key: SETTINGS_KEY,
    userName: String(draft.userName || DEMO_USER.userName).trim() || DEMO_USER.userName,
    accountLabel: DEMO_USER.accountLabel,
    totalBalance,
    savingsTarget,
    onboarded: true,
    onboardedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  }

  await db.transaction('rw', db.settings, db.pockets, db.missions, db.transactions, async () => {
    await db.transactions.clear()
    await db.missions.clear()
    await db.pockets.clear()
    await db.settings.clear()

    await db.settings.put(settings)
    for (const key of POCKET_KEYS) await db.pockets.put({ key, amount: pockets[key] })
    await db.transactions.put({
      id: newId('saldo'),
      name: 'Saldo awal simulasi',
      amount: totalBalance,
      direction: 'in',
      type: 'income',
      category: 'topup',
      note: 'Saldo disimulasikan untuk mencoba HoldUp!.',
      date: new Date().toISOString(),
    })
    await db.settings.put({ key: META_KEY, legacyMigrated: true, migratedAt: new Date().toISOString() })
  })

  return { ok: true, error: '' }
}

/* ------------------------------------------------------- saldo & kantong -- */

/**
 * Menyimpan total saldo dan seluruh alokasi sekaligus. Nilai yang membuat
 * Saldo Aman negatif tetap boleh disimpan — hanya diberi peringatan di UI.
 */
export async function saveBalanceSettings(patch = {}) {
  const totalBalance = toAmount(patch.totalBalance)
  if (totalBalance <= 0) {
    return { ok: false, error: 'Total saldo harus lebih besar dari Rp0.', field: 'totalBalance' }
  }

  const values = {
    bill: toAmount(patch.bill),
    savings: toAmount(patch.savings),
    emergency: toAmount(patch.emergency),
  }
  const savingsTarget = toAmount(patch.savingsTarget)

  const result = await db.transaction(
    'rw',
    db.settings,
    db.pockets,
    async () => {
      const current = (await db.settings.get(SETTINGS_KEY)) || buildDemoSettings()
      const next = { ...current, totalBalance, savingsTarget, updatedAt: new Date().toISOString() }
      await db.settings.put(next)
      for (const key of POCKET_KEYS) {
        await db.pockets.put({ key, amount: values[key] })
      }
      return computeSafeBalance(next, values)
    },
  )

  return { ok: true, error: '', safeBalance: result }
}

export async function recordIncome({ name, amount, category = 'topup', note = '' } = {}) {
  const value = toAmount(amount)
  if (value <= 0) return { ok: false, error: 'Nominal harus lebih besar dari Rp0.' }

  const transaction = await db.transaction(
    'rw',
    db.settings,
    db.transactions,
    async () => {
      const current = (await db.settings.get(SETTINGS_KEY)) || buildDemoSettings()
      const next = { ...current, totalBalance: toAmount(current.totalBalance) + value }
      await db.settings.put(next)
      const row = {
        id: newId('in'),
        name: String(name || 'Pemasukan').trim() || 'Pemasukan',
        amount: value,
        direction: 'in',
        type: 'income',
        category,
        note,
        date: new Date().toISOString(),
      }
      await db.transactions.put(row)
      return { row, totalBalance: next.totalBalance }
    },
  )

  return { ok: true, error: '', transaction: transaction.row, totalBalance: transaction.totalBalance }
}

/**
 * Mencatat pengeluaran dan mengurangi total saldo dalam satu transaksi Dexie.
 * Saldo Aman boleh jadi negatif: HoldUp! mengingatkan, bukan memblokir.
 */
export async function recordExpense({ name, amount, category = 'lainnya', note = '' } = {}) {
  const value = toAmount(amount)
  if (value <= 0) return { ok: false, error: 'Nominal harus lebih besar dari Rp0.' }

  const result = await db.transaction(
    'rw',
    db.settings,
    db.pockets,
    db.transactions,
    async () => {
      const current = (await db.settings.get(SETTINGS_KEY)) || buildDemoSettings()
      const pocketRows = await db.pockets.toArray()
      const pockets = pocketMapFromRows(pocketRows)
      const safeBefore = computeSafeBalance(current, pockets)

      const next = { ...current, totalBalance: toAmount(current.totalBalance) - value }
      await db.settings.put(next)

      const row = {
        id: newId('out'),
        name: String(name || 'Pengeluaran').trim() || 'Pengeluaran',
        amount: value,
        direction: 'out',
        type: 'expense',
        category,
        note,
        date: new Date().toISOString(),
      }
      await db.transactions.put(row)

      return {
        transaction: row,
        safeBefore,
        safeAfter: computeSafeBalance(next, pockets),
        totalBalance: toAmount(next.totalBalance),
        shortfall: Math.max(0, value - safeBefore),
      }
    },
  )

  return { ok: true, error: '', ...result }
}

/**
 * Memindahkan dana dari Saldo Aman ke kantong Tabungan (dipakai misi tabungan).
 * Total saldo tidak berubah — yang berubah hanya alokasi, sehingga dana misi
 * tidak pernah dihitung dua kali.
 */
export async function allocateToSavings({ amount, name = 'Pindah ke kantong Tabungan', note = '' } = {}) {
  const value = toAmount(amount)
  if (value <= 0) return { ok: false, error: 'Nominal harus lebih besar dari Rp0.' }

  const result = await db.transaction(
    'rw',
    db.settings,
    db.pockets,
    db.transactions,
    async () => {
      const current = (await db.settings.get(SETTINGS_KEY)) || buildDemoSettings()
      const pockets = pocketMapFromRows(await db.pockets.toArray())
      const safeBalance = computeSafeBalance(current, pockets)

      if (value > safeBalance) {
        return {
          ok: false,
          error: `Saldo Aman kamu hanya Rp${Math.max(0, safeBalance).toLocaleString('id-ID')}.`,
        }
      }

      await db.pockets.put({ key: 'savings', amount: pockets.savings + value })
      const row = {
        id: newId('alloc'),
        name,
        amount: value,
        direction: 'internal',
        type: 'allocation',
        category: 'tabungan',
        note,
        date: new Date().toISOString(),
      }
      await db.transactions.put(row)
      return { ok: true, row, safeBalance: safeBalance - value }
    },
  )

  return result
}

/* ---------------------------------------------------------------- misi --- */

export async function createMission({ name, target, initialAmount = 0, note = '' } = {}) {
  const cleanName = String(name || '').trim()
  if (cleanName.length < 3) {
    return { ok: false, error: 'Nama misi minimal 3 karakter.', field: 'name' }
  }
  const targetValue = toAmount(target)
  if (targetValue <= 0) {
    return { ok: false, error: 'Target nominal harus lebih besar dari Rp0.', field: 'target' }
  }
  const initial = toAmount(initialAmount)
  if (initial > targetValue) {
    return { ok: false, error: 'Saldo awal tidak perlu melebihi target misi.', field: 'initialAmount' }
  }

  const mission = {
    id: newId('mission'),
    name: cleanName,
    target: targetValue,
    saved: initial,
    note,
    status: initial >= targetValue ? 'done' : 'active',
    createdAt: new Date().toISOString(),
  }

  const result = await db.transaction(
    'rw',
    db.settings,
    db.pockets,
    db.missions,
    db.transactions,
    async () => {
      const current = (await db.settings.get(SETTINGS_KEY)) || buildDemoSettings()
      const pockets = pocketMapFromRows(await db.pockets.toArray())
      const safeBalance = computeSafeBalance(current, pockets)

      // Tanpa saldo awal, misi tetap boleh dibuat walau Saldo Aman sedang minus.
      if (initial > 0 && initial > safeBalance) {
        return {
          ok: false,
          error: `Saldo Aman kamu hanya Rp${Math.max(0, safeBalance).toLocaleString('id-ID')}, belum cukup untuk saldo awal misi.`,
          field: 'initialAmount',
        }
      }

      await db.missions.put(mission)
      if (initial > 0) {
        await db.pockets.put({ key: 'savings', amount: pockets.savings + initial })
        await db.transactions.put({
          id: newId('alloc'),
          name: `Saldo awal misi ${cleanName}`,
          amount: initial,
          direction: 'internal',
          type: 'allocation',
          category: 'tabungan',
          note: 'Dipindahkan ke kantong Tabungan.',
          date: new Date().toISOString(),
        })
      }
      return { ok: true }
    },
  )

  if (!result.ok) return result
  return { ok: true, error: '', mission }
}

export async function addFundsToMission({ missionId, amount } = {}) {
  const value = toAmount(amount)
  if (value <= 0) return { ok: false, error: 'Nominal harus lebih besar dari Rp0.' }

  return db.transaction(
    'rw',
    db.settings,
    db.pockets,
    db.missions,
    db.transactions,
    async () => {
      const mission = await db.missions.get(missionId)
      if (!mission) return { ok: false, error: 'Misi tidak ditemukan.' }

      const current = (await db.settings.get(SETTINGS_KEY)) || buildDemoSettings()
      const pockets = pocketMapFromRows(await db.pockets.toArray())
      const safeBalance = computeSafeBalance(current, pockets)

      if (value > safeBalance) {
        return {
          ok: false,
          error: `Saldo Aman kamu hanya Rp${Math.max(0, safeBalance).toLocaleString('id-ID')}.`,
        }
      }

      const saved = toAmount(mission.saved) + value
      const updated = {
        ...mission,
        saved,
        status: saved >= toAmount(mission.target) ? 'done' : 'active',
      }
      await db.missions.put(updated)
      await db.pockets.put({ key: 'savings', amount: pockets.savings + value })
      await db.transactions.put({
        id: newId('alloc'),
        name: `Tabungan misi ${mission.name}`,
        amount: value,
        direction: 'internal',
        type: 'allocation',
        category: 'tabungan',
        note: 'Dipindahkan ke kantong Tabungan.',
        date: new Date().toISOString(),
      })

      return { ok: true, mission: updated, completed: updated.status === 'done' }
    },
  )
}

/* --------------------------------------------------------------- reset --- */

export async function resetToDemo() {
  await seedDemoData()
  return { ok: true }
}

export async function wipeData() {
  await db.transaction('rw', db.settings, db.pockets, db.missions, db.transactions, async () => {
    await db.transactions.clear()
    await db.missions.clear()
    await db.pockets.clear()
    await db.settings.clear()
  })
  await db.settings.put({ key: META_KEY, legacyMigrated: true, migratedAt: new Date().toISOString() })
  return { ok: true }
}
