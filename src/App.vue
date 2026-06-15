<script setup lang="ts">
import { RouterView } from 'vue-router'

import { useAuthStore } from '@/stores/useAuthStore'

useAuthStore()
</script>

<template>
  <RouterView />
</template>
