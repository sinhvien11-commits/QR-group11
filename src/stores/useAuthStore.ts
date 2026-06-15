import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { User } from 'firebase/auth'

import { observeAuthState, signIn, signOut, signUp } from '@/services/auth'

const AUTH_ERROR_MAP: Record<string, string> = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'The email address is not valid.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/invalid-credential': 'Invalid email or password.',
}

function hasCode(err: unknown): err is { code: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  )
}

function resolveError(err: unknown): string {
  if (hasCode(err)) {
    return AUTH_ERROR_MAP[err.code] ?? 'An unexpected error occurred. Please try again.'
  }
  return 'An unexpected error occurred. Please try again.'
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isReady = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed<boolean>(() => currentUser.value !== null)

  observeAuthState((user) => {
    currentUser.value = user
    isReady.value = true
  })

  function clearError(): void {
    error.value = null
  }

  async function login(email: string, password: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await signIn(email, password)
    } catch (err: unknown) {
      error.value = resolveError(err)
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await signUp(email, password)
    } catch (err: unknown) {
      error.value = resolveError(err)
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await signOut()
    } catch (err: unknown) {
      error.value = resolveError(err)
    } finally {
      loading.value = false
    }
  }

  return {
    currentUser,
    isReady,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    clearError,
  }
})
