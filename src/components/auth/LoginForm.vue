<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/useAuthStore'

import { EMAIL_RE } from '@/constants/auth.constants'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

import '@/assets/auth-form.css'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const touched = reactive({ email: false, password: false })

const emailError = computed<string>(() => {
  if (!email.value) return 'Email is required.'
  if (!EMAIL_RE.test(email.value)) return 'Enter a valid email address.'
  return ''
})

const passwordError = computed<string>(() => {
  if (!password.value) return 'Password is required.'
  if (password.value.length < 6) return 'Password must be at least 6 characters.'
  return ''
})

const isValid = computed<boolean>(() => !emailError.value && !passwordError.value)

onMounted(() => {
  authStore.clearError()
})

async function handleSubmit(): Promise<void> {
  touched.email = true
  touched.password = true
  if (!isValid.value) return
  await authStore.login(email.value, password.value)
  if (!authStore.error) {
    await router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="auth-card">
    <h1 class="auth-title">Sign in</h1>

    <form novalidate @submit.prevent="handleSubmit">
      <div class="field">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :aria-invalid="(touched.email && !!emailError) ? true : undefined"
          :aria-describedby="(touched.email && emailError) ? 'login-email-err' : undefined"
          @blur="touched.email = true"
        />
        <span v-if="touched.email && emailError" id="login-email-err" class="field-error" role="alert">
          {{ emailError }}
        </span>
      </div>

      <div class="field">
        <label for="login-password">Password</label>
        <div class="input-row">
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="Password"
            :aria-invalid="(touched.password && !!passwordError) ? true : undefined"
            :aria-describedby="(touched.password && passwordError) ? 'login-pass-err' : undefined"
            @blur="touched.password = true"
          />
          <button
            type="button"
            class="eye-btn"
            :aria-pressed="showPassword"
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
        </div>
        <span v-if="touched.password && passwordError" id="login-pass-err" class="field-error" role="alert">
          {{ passwordError }}
        </span>
      </div>

      <p v-if="authStore.error" class="server-error" role="alert">{{ authStore.error }}</p>

      <button type="submit" class="submit-btn" :disabled="!isValid || authStore.loading">
        <LoadingSpinner v-if="authStore.loading" size="sm" />
        {{ authStore.loading ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="switch-link">
      Don't have an account?
      <RouterLink to="/register">Create one</RouterLink>
    </p>
  </div>
</template>
