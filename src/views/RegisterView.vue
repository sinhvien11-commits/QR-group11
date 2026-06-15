<script setup lang="ts">
import RegisterForm from '@/components/auth/RegisterForm.vue'
</script>

<template>
  <main class="auth-page">
    <RegisterForm />
  </main>
</template>

<style scoped>
.auth-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  min-height: 100svh;
  box-sizing: border-box;
}
</style>
