<script setup lang="ts">
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from '@lucide/vue'
import { useToast } from '../../composables/useToast'

const { toasts, remove } = useToast()

const icons = {
  success: CheckCircle2,
  error:   XCircle,
  warn:    AlertTriangle,
  info:    Info,
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast"
          :class="t.type"
        >
          <component :is="icons[t.type]" :size="18" class="toast-ico" />
          <span class="toast-msg">{{ t.msg }}</span>
          <button class="toast-close" type="button" @click="remove(t.id)">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid;
  min-width: 280px;
  max-width: 400px;
  font-size: .875rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,.10);
  pointer-events: all;
}

.toast.success {
  background: var(--color-success-bg);
  border-color: var(--color-success-border);
  color: var(--color-success);
}
.toast.success .toast-ico { color: var(--color-success); }

.toast.error {
  background: var(--color-error-bg);
  border-color: var(--color-error-border);
  color: var(--color-error);
}
.toast.error .toast-ico { color: var(--color-error); }

.toast.warn {
  background: var(--color-warning-bg);
  border-color: var(--color-warning-border);
  color: var(--color-warning);
}
.toast.warn .toast-ico { color: var(--color-warning); }

.toast.info {
  background: var(--color-info-bg);
  border-color: var(--color-info-border);
  color: var(--color-info);
}
.toast.info .toast-ico { color: var(--color-info); }

.toast-ico { flex-shrink: 0; }

.toast-msg { flex: 1; line-height: 1.4; }

.toast-close {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  opacity: .55;
  display: flex;
  align-items: center;
  color: inherit;
}
.toast-close:hover { opacity: 1; }

/* Animación entrada/salida */
.toast-enter-active { transition: all .25s ease; }
.toast-leave-active { transition: all .2s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(12px) scale(.97); }
.toast-leave-to     { opacity: 0; transform: translateX(20px); }
</style>
