<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (!dialogRef.value) return
    if (isOpen) {
      dialogRef.value.showModal()
    } else {
      dialogRef.value.close()
    }
  },
)

onMounted(() => {
  if (props.open) dialogRef.value?.showModal()
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="confirm-dialog"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-desc"
    @cancel.prevent="emit('cancel')"
  >
    <h2 id="dialog-title" class="dialog-title">{{ title }}</h2>
    <p id="dialog-desc" class="dialog-message">{{ message }}</p>
    <div class="dialog-actions">
      <button class="dialog-btn dialog-btn--cancel" autofocus @click="emit('cancel')">
        Cancel
      </button>
      <button class="dialog-btn dialog-btn--confirm" @click="emit('confirm')">
        Confirm
      </button>
    </div>
  </dialog>
</template>

<style scoped>
.confirm-dialog {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--bg);
  color: var(--text-h);
  padding: 28px;
  max-width: min(420px, 90vw);
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.confirm-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 10px;
  letter-spacing: -0.3px;
}

.dialog-message {
  font-size: 14px;
  color: var(--text);
  line-height: 1.5;
  margin: 0 0 24px;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 9px 18px;
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s;
}

.dialog-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.dialog-btn--cancel {
  background: transparent;
  color: var(--text-h);
  border: 1px solid var(--border);
}

.dialog-btn--cancel:hover {
  background: var(--code-bg);
}

.dialog-btn--confirm {
  background: #ef4444;
  color: #fff;
  border: none;
}

.dialog-btn--confirm:hover {
  opacity: 0.88;
}
</style>
