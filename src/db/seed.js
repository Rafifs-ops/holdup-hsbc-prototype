/**
 * Demo dataset used by onboarding ("pakai data demo") and by "Reset data demo".
 * Numbers live here so a walkthrough can always start from a presentable state.
 */

export const DEMO_USER = {
  userName: 'Rani Anggraini',
  accountLabel: 'Rekening Utama •••• 4821',
}

/** Total saldo 8,5 jt − 2 jt − 1,5 jt − 1 jt − 500 rb = Saldo Aman 3,5 jt */
export const DEMO_MISSION_SAVED = 1_200_000
export const DEMO_TOTALS = {
  totalBalance: 8_500_000,
  bill: 2_000_000,
  savings: 1_500_000,
  emergency: 1_000_000,
  savingsTarget: 500_000,
}

export const SCHEMA_VERSION = 1

function daysAgoIso(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString()
}

export function buildDemoSettings() {
  return {
    key: 'main',
    ...DEMO_USER,
    totalBalance: DEMO_TOTALS.totalBalance,
    savingsTarget: DEMO_TOTALS.savingsTarget,
    autoRoundupEnabled: false,
    onboarded: true,
    onboardedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
  }
}

export function buildDemoPockets() {
  return [
    { key: 'bill', amount: DEMO_TOTALS.bill },
    { key: 'savings', amount: DEMO_TOTALS.savings },
    { key: 'emergency', amount: DEMO_TOTALS.emergency },
  ]
}

export function buildDemoMissions() {
  return [
    {
      id: 'mission-laptop',
      name: 'Laptop Baru',
      target: 12_000_000,
      saved: DEMO_MISSION_SAVED,
      note: 'Untuk kerja dan kelas malam',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ]
}

const DEMO_TRANSACTION_SEED = [
  { name: 'Kopi Kenangan', category: 'makan', amount: 28_000, direction: 'out', type: 'expense', hoursAgo: 3 },
  { name: 'Top up saldo', category: 'topup', amount: 500_000, direction: 'in', type: 'income', hoursAgo: 26 },
  { name: 'Tagihan listrik PLN', category: 'tagihan', amount: 312_500, direction: 'out', type: 'expense', hoursAgo: 52 },
  { name: 'Transfer ke Rani', category: 'transfer', amount: 150_000, direction: 'out', type: 'expense', hoursAgo: 76 },
  { name: 'Pindah ke kantong Tabungan', category: 'tabungan', amount: 250_000, direction: 'internal', type: 'allocation', hoursAgo: 98 },
  { name: 'Langganan streaming', category: 'hiburan', amount: 54_000, direction: 'out', type: 'expense', hoursAgo: 120 },
  { name: 'Belanja bulanan', category: 'belanja', amount: 480_000, direction: 'out', type: 'expense', hoursAgo: 148 },
]

export function buildDemoTransactions() {
  return DEMO_TRANSACTION_SEED.map((item, index) => ({
    id: `seed-${index + 1}`,
    name: item.name,
    category: item.category,
    amount: item.amount,
    direction: item.direction,
    type: item.type,
    note: '',
    date: daysAgoIso(item.hoursAgo),
  }))
}
