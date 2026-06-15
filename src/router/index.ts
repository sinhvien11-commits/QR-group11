import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import { useAuthStore } from '@/stores/useAuthStore'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
  },
  {
    path: '/generate',
    name: 'generate',
    component: () => import('@/views/GenerateView.vue'),
  },
  {
    path: '/scan',
    name: 'scan',
    component: () => import('@/views/ScanView.vue'),
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('@/views/LibraryView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.requiresAuth !== true) return

  const authStore = useAuthStore()

  if (!authStore.isReady) {
    await new Promise<void>((resolve) => {
      const unwatch = watch(
        () => authStore.isReady,
        (ready) => {
          if (ready) {
            unwatch()
            resolve()
          }
        },
        { immediate: true },
      )
    })
  }

  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }
})

export default router
