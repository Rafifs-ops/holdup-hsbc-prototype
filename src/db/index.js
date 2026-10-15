import Dexie from 'dexie'

/**
 * Central IndexedDB database for the prototype. IndexedDB is the single
 * persistent source of truth for money data — Pinia only mirrors it in memory
 * so the UI stays reactive.
 *
 * Tables
 *  - settings      : one row per key ('main' = konfigurasi finansial, 'meta' = bookkeeping)
 *  - pockets       : 'bill' | 'savings' | 'emergency'
 *  - missions      : tujuan tabungan (target jangka panjang, bukan alokasi)
 *  - transactions  : riwayat transaksi + perubahan alokasi
 */
export const DB_NAME = 'holdup'

export const SETTINGS_KEY = 'main'
export const META_KEY = 'meta'

export const POCKET_KEYS = ['bill', 'savings', 'emergency']

export const db = new Dexie(DB_NAME)

db.version(1).stores({
  settings: 'key',
  pockets: 'key',
  missions: 'id, createdAt, status',
  transactions: 'id, date, type, direction, category',
})

/** Wipes the local database — only used by tooling/tests. */
export async function destroyDatabase() {
  await db.delete()
}
