<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">
      <slot name="icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      </slot>
    </div>
    <h3 class="empty-title">{{ title }}</h3>
    <p class="empty-msg">{{ message }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 64px 24px;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.empty-icon { display: flex; }

.empty-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.empty-msg {
  font-size: .875rem;
  color: var(--color-text-muted);
  max-width: 360px;
  line-height: 1.65;
}

.empty-action { margin-top: 4px; }
</style>
