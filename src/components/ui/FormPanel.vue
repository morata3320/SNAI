<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <Transition name="slide-right">
    <div v-if="show" class="form-overlay" @click.self="$emit('close')">
      <div class="form-panel" role="dialog" :aria-label="title">
        <div class="form-panel-head">
          <h2 class="form-panel-title">{{ title }}</h2>
          <button class="form-close" @click="$emit('close')" aria-label="Cerrar panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="form-panel-body">
          <slot />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: flex;
  justify-content: flex-end;
  z-index: 100;
}

.form-panel {
  width: 100%;
  max-width: 480px;
  background: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0,0,0,.12);
}

.form-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.form-panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.form-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-placeholder);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: background .15s, color .15s;
}
.form-close:hover { background: var(--color-surface-mute); color: var(--color-text-secondary); }

.form-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.slide-right-enter-active,
.slide-right-leave-active { transition: all .25s ease; }
.slide-right-enter-from .form-panel,
.slide-right-leave-to .form-panel  { transform: translateX(100%); }
.slide-right-enter-from,
.slide-right-leave-to  { background: transparent; }
</style>
