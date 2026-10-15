import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import { useFinanceStore } from './stores/finance'
import { useMissionsStore } from './stores/missions'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

/**
 * Buka IndexedDB lebih dulu, baru pasang router: aplikasi tidak pernah membaca
 * atau menulis saldo sebelum penyimpanan siap. Pinia tetap menerima error agar
 * App.vue bisa menampilkan status gagal + tombol coba lagi.
 */
async function bootstrap() {
  const finance = useFinanceStore(pinia)
  const missions = useMissionsStore(pinia)

  try {
    await Promise.all([finance.init(), missions.init()])
  } catch (error) {
    console.error('[HoldUp!] bootstrap gagal:', error)
  }

  app.use(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap()
