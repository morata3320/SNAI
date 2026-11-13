<script setup lang="ts">
defineProps<{
  label: string
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'orange'
}>()
</script>

<template>
  <span class="badge" :class="`badge--${color}`">{{ label }}</span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  font-size: .7rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.badge--green  { background: var(--color-success-bg); color: var(--color-success); }
.badge--blue   { background: var(--color-info-bg); color: var(--color-brand-blue); }
.badge--yellow { background: var(--color-warning-bg); color: var(--color-warning); }
.badge--red    { background: var(--color-error-bg); color: var(--color-error); }
.badge--gray   { background: var(--color-surface-mute); color: var(--color-text-muted); }
.badge--orange { background: var(--color-warning-bg); color: var(--color-warning); }
</style>
