import { createRouter, createWebHistory } from 'vue-router'
import { useFinanceStore } from '@/stores/finance'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/mulai',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { title: 'Mulai', bare: true },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Saldo Aman' },
    },
    {
      path: '/holdup',
      name: 'holdup',
      component: () => import('@/views/HoldupDetailView.vue'),
      meta: { title: 'HoldUp!' },
    },
    {
      path: '/kantong',
      name: 'pockets',
      component: () => import('@/views/PocketsView.vue'),
      meta: { title: 'Kantong & Saldo' },
    },
    {
      path: '/misi',
      name: 'missions',
      component: () => import('@/views/MissionsView.vue'),
      meta: { title: 'Misi Tabungan' },
    },
    {
      path: '/aktivitas',
      name: 'activity',
      component: () => import('@/views/ActivityView.vue'),
      meta: { title: 'Aktivitas' },
    },
    {
      path: '/menu',
      name: 'menu',
      component: () => import('@/views/MenuView.vue'),
      meta: { title: 'Menu' },
    },
    {
      path: '/topup',
      name: 'topup',
      component: () => import('@/views/TopUpView.vue'),
      meta: { title: 'Top Up', subtitle: 'Tambah saldo simulasi' },
    },
    {
      path: '/transfer',
      name: 'transfer',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        title: 'Transfer',
        subtitle: 'Kirim uang ke rekening lain',
        icon: 'send',
        body: 'Alur transfer lengkap belum termasuk di prototipe ini, tetapi peringatan Saldo Aman yang sama akan dipakai sebelum transaksi dikirim.',
      },
    },
    {
      path: '/bayar',
      name: 'pay',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        title: 'Bayar',
        subtitle: 'Bayar tagihan dan merchant',
        icon: 'card',
        body: 'Pembayaran tagihan dan merchant akan memakai jeda HoldUp! yang sama seperti saat mencatat pengeluaran.',
      },
    },
    {
      path: '/layanan',
      name: 'services',
      component: () => import('@/views/PlaceholderView.vue'),
      meta: {
        title: 'Semua Layanan',
        subtitle: 'Fitur perbankan lainnya',
        icon: 'grid',
        body: 'Halaman ini menjadi pintu ke layanan lain, misalnya kartu, investasi, dan pengaturan keamanan.',
      },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

/**
 * Onboarding hanya muncul kalau pengguna belum pernah mengisi saldo, dan data
 * finansial tidak dibaca sebelum IndexedDB selesai dibuka.
 */
router.beforeEach((to) => {
  const finance = useFinanceStore()
  if (!finance.ready) return true

  if (!finance.onboarded && to.name !== 'onboarding') {
    return { name: 'onboarding', replace: true }
  }
  if (finance.onboarded && to.name === 'onboarding') {
    return { name: 'home', replace: true }
  }
  return true
})

router.afterEach((to) => {
  if (typeof document === 'undefined') return
  document.title = to.meta?.title ? `${to.meta.title} — HoldUp!` : 'HoldUp! — Saldo Aman'
})

export default router
