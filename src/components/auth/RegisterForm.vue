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
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)
const touched = reactive({ email: false, password: false, confirm: false })

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

const confirmError = computed<string>(() => {
  if (!confirmPassword.value) return 'Please confirm your password.'
  if (confirmPassword.value !== password.value) return 'Passwords do not match.'
  return ''
})

const isValid = computed<boolean>(
  () => !emailError.value && !passwordError.value && !confirmError.value,
)

onMounted(() => {
  authStore.clearError()
})

async function handleSubmit(): Promise<void> {
  touched.email = true
  touched.password = true
  touched.confirm = true
  if (!isValid.value) return
  await authStore.register(email.value, password.value)
  if (!authStore.error) {
    await router.push({ name: 'home' })
  }
}
</script>

<template>
  <div class="auth-card">
    <h1 class="auth-title">Create account</h1>

    <form novalidate @submit.prevent="handleSubmit">
      <div class="field">
        <label for="reg-email">Email</label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          :aria-invalid="(touched.email && !!emailError) ? true : undefined"
          :aria-describedby="(touched.email && emailError) ? 'reg-email-err' : undefined"
          @blur="touched.email = true"
        />
        <span v-if="touched.email && emailError" id="reg-email-err" class="field-error" role="alert">
          {{ emailError }}
        </span>
      </div>

      <div class="field">
        <label for="reg-password">Password</label>
        <div class="input-row">
          <input
            id="reg-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="At least 6 characters"
            :aria-invalid="(touched.password && !!passwordError) ? true : undefined"
            :aria-describedby="(touched.password && passwordError) ? 'reg-pass-err' : undefined"
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
        <span v-if="touched.password && passwordError" id="reg-pass-err" class="field-error" role="alert">
          {{ passwordError }}
        </span>
      </div>

      <div class="field">
        <label for="reg-confirm">Confirm password</label>
        <div class="input-row">
          <input
            id="reg-confirm"
            v-model="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            autocomplete="new-password"
            placeholder="Repeat password"
            :aria-invalid="(touched.confirm && !!confirmError) ? true : undefined"
            :aria-describedby="(touched.confirm && confirmError) ? 'reg-confirm-err' : undefined"
            @blur="touched.confirm = true"
          />
          <button
            type="button"
            class="eye-btn"
            :aria-pressed="showConfirm"
            :aria-label="showConfirm ? 'Hide confirm password' : 'Show confirm password'"
            @click="showConfirm = !showConfirm"
          >
            {{ showConfirm ? 'Hide' : 'Show' }}
          </button>
        </div>
        <span v-if="touched.confirm && confirmError" id="reg-confirm-err" class="field-error" role="alert">
          {{ confirmError }}
        </span>
      </div>

      <p v-if="authStore.error" class="server-error" role="alert">{{ authStore.error }}</p>

      <button type="submit" class="submit-btn" :disabled="!isValid || authStore.loading">
        <LoadingSpinner v-if="authStore.loading" size="sm" />
        {{ authStore.loading ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="switch-link">
      Already have an account?
      <RouterLink to="/login">Sign in</RouterLink>
    </p>
  </div>
</template>
