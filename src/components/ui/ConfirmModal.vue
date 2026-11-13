<script setup lang="ts">
withDefaults(defineProps<{
  show: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warn'
}>(), {
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'danger',
})

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('cancel')">
      <div class="modal" role="alertdialog" :aria-label="title">
        <div class="modal-icon" :class="`modal-icon--${variant}`">
          <svg v-if="variant === 'danger'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-body">{{ message }}</p>
        <div class="modal-actions">
          <button class="btn-ghost" @click="$emit('cancel')">{{ cancelLabel }}</button>
          <button class="btn-confirm" :class="`btn-confirm--${variant}`" @click="$emit('confirm')">
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 28px 28px 24px;
  max-width: 380px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,.15);
}

.modal-icon {
  padding: 14px;
  border-radius: 50%;
}

.modal-icon--danger { background: var(--color-error-bg); color: var(--color-error); }
.modal-icon--warn   { background: var(--color-warning-bg); color: var(--color-warning); }

.modal-title { font-size: 1rem; font-weight: 700; color: var(--color-text-primary); }
.modal-body  { font-size: .875rem; color: var(--color-text-muted); line-height: 1.6; }

.modal-actions { display: flex; gap: 10px; margin-top: 4px; }

.btn-ghost {
  padding: 8px 16px;
  background: #fff;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: .8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s;
}
.btn-ghost:hover { background: var(--color-surface-soft); }

.btn-confirm {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: .8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  color: #fff;
}
.btn-confirm--danger { background: var(--color-error); }
.btn-confirm--danger:hover { background: var(--color-error); }
.btn-confirm--warn   { background: var(--color-warning); }
.btn-confirm--warn:hover   { background: var(--color-warning); }

.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }
</style>
